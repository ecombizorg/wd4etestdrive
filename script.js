$(function() {
    // Constants for data limits
    const NOTE_NAME_MAX_LENGTH = 80;
    const NOTE_CONTENT_MAX_SIZE = 16 * 1024; // 16 KB in bytes

    // Single Instance Logic (from v0.002)
    const heartbeatKey = "myWebNotesApp_heartbeat";
    const focusRequestKey = "myWebNotesApp_focusRequest";
    const instanceId = Date.now();
    const heartbeatInterval = 500; // milliseconds

    function isOtherInstanceRunning() {
        const heartbeatData = localStorage.getItem(heartbeatKey);
        if (heartbeatData) {
            try {
                const data = JSON.parse(heartbeatData);
                if (data && data.timestamp && (Date.now() - data.timestamp < 2000)) { // Consider active if heartbeat within the last 2 seconds
                    return true;
                }
            } catch (e) {
                // Invalid JSON, assume no instance
                return false;
            }
        }
        return false;
    }

    function sendFocusRequest() {
        localStorage.setItem(focusRequestKey, window.location.href);
    }

    function setHeartbeat() {
        const data = { instanceId: instanceId, timestamp: Date.now() };
        localStorage.setItem(heartbeatKey, JSON.stringify(data));
    }

    function clearHeartbeat() {
        const storedHeartbeat = localStorage.getItem(heartbeatKey);
        if (storedHeartbeat) {
            try {
                const data = JSON.parse(storedHeartbeat);
                if (data && data.instanceId === instanceId) {
                    localStorage.removeItem(heartbeatKey);
                }
            } catch (e) {
                // Ignore errors during cleanup
            }
        }
    }

    if (isOtherInstanceRunning()) {
        sendFocusRequest();
        window.close();
    } else {
        setHeartbeat();
        setInterval(setHeartbeat, heartbeatInterval);
        window.addEventListener('beforeunload', clearHeartbeat);
        localStorage.removeItem(focusRequestKey);
    }

    // Resizable Pane Logic (from v0.003)
    const separator = $('.pane-separator');
    const foldersPane = $('#folders-pane');
    const notesListContainer = $('#notes-list-container');
    let isResizing = false;
    let startY = 0;
    let initialFoldersHeight = 0;
    let initialNotesListHeight = 0;

    separator.on('mousedown', function(e) {
        isResizing = true;
        startY = e.clientY;
        initialFoldersHeight = foldersPane.height();
        initialNotesListHeight = notesListContainer.height();
    });

    $(document).on('mousemove', function(e) {
        if (!isResizing) return;
        const deltaY = e.clientY - startY;
        foldersPane.height(initialFoldersHeight + deltaY);
        notesListContainer.height(initialNotesListHeight - deltaY);
    });

    $(document).on('mouseup', function() {
        if (isResizing) {
            isResizing = false;
        }
    });

    // Note Content Size Limit Enforcement
    const editor = $('#editor');
    const editorStatus = $('#editor-status');

    editor.on('input', function() {
        const content = $(this).val();
        const contentLength = content.length;

        if (contentLength > NOTE_CONTENT_MAX_SIZE) {
            $(this).val(content.substring(0, NOTE_CONTENT_MAX_SIZE)); // Truncate
            editorStatus.text(`Note size limit reached: ${NOTE_CONTENT_MAX_SIZE / 1024} KB`);
        } else {
            editorStatus.text(`Size: ${contentLength} characters / ${NOTE_CONTENT_MAX_SIZE / 1024} KB limit`);
        }
    });

    // Initial editor status update
    editor.trigger('input');
});