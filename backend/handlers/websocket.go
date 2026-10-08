package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow cross-origin connection from Vercel frontend
	},
}

type WsHub struct {
	clients map[*websocket.Conn]bool
	mu      sync.RWMutex
}

var Hub = &WsHub{
	clients: make(map[*websocket.Conn]bool),
}

type WsMessage struct {
	Type    string      `json:"type"`    // "telemetry", "state", "event"
	Payload interface{} `json:"payload"`
}

// HandleWebSocket handles client connections
func (h *WsHub) HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("[WebSocket] Upgrade error:", err)
		return
	}

	h.mu.Lock()
	h.clients[conn] = true
	h.mu.Unlock()

	defer func() {
		h.mu.Lock()
		delete(h.clients, conn)
		h.mu.Unlock()
		conn.Close()
	}()

	// Keep alive reader
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

// Broadcast sends a message to all connected clients
func (h *WsHub) Broadcast(msgType string, payload interface{}) {
	msg := WsMessage{
		Type:    msgType,
		Payload: payload,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for conn := range h.clients {
		err := conn.WriteMessage(websocket.TextMessage, data)
		if err != nil {
			conn.Close()
			delete(h.clients, conn)
		}
	}
}
