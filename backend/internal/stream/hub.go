package stream

import (
    "sync"
)

type Subscriber struct {
    Ch chan []byte
}

type Hub struct {
    mu    sync.RWMutex
    subs  map[int64]map[*Subscriber]struct{}
    bufSz int
}

func NewHub() *Hub {
    return &Hub{subs: make(map[int64]map[*Subscriber]struct{}), bufSz: 32}
}

func (h *Hub) Subscribe(carID int64) *Subscriber {
    h.mu.Lock()
    defer h.mu.Unlock()
    sub := &Subscriber{Ch: make(chan []byte, h.bufSz)}
    m, ok := h.subs[carID]
    if !ok {
        m = make(map[*Subscriber]struct{})
        h.subs[carID] = m
    }
    m[sub] = struct{}{}
    return sub
}

func (h *Hub) Unsubscribe(carID int64, sub *Subscriber) {
    h.mu.Lock(); defer h.mu.Unlock()
    if m, ok := h.subs[carID]; ok {
        delete(m, sub)
        close(sub.Ch)
        if len(m) == 0 {
            delete(h.subs, carID)
        }
    }
}

func (h *Hub) Broadcast(carID int64, payload []byte) {
    h.mu.RLock(); defer h.mu.RUnlock()
    if len(payload) == 0 { return }
    for sub := range h.subs[carID] {
        select {
        case sub.Ch <- payload:
        default:
            // drop on slow
        }
    }
}


