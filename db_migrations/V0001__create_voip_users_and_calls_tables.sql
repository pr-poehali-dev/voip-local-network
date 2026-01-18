-- Таблица пользователей VoIP системы
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    peer_id VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'in_call')),
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица истории звонков
CREATE TABLE IF NOT EXISTS call_logs (
    id SERIAL PRIMARY KEY,
    caller_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'missed', 'active', 'declined')),
    duration INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_peer_id ON users(peer_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_caller ON call_logs(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_receiver ON call_logs(receiver_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_started_at ON call_logs(started_at DESC);

-- Вставка тестовых данных
INSERT INTO users (name, phone, peer_id, status) VALUES 
    ('Алексей Иванов', '+7 (495) 123-45-67', 'peer_001', 'online'),
    ('Мария Петрова', '+7 (812) 234-56-78', 'peer_002', 'online'),
    ('Дмитрий Сидоров', '+7 (903) 345-67-89', 'peer_003', 'offline'),
    ('Елена Смирнова', '+7 (916) 456-78-90', 'peer_004', 'online')
ON CONFLICT DO NOTHING;

INSERT INTO call_logs (caller_id, receiver_id, status, duration, started_at, ended_at) VALUES 
    (1, 2, 'completed', 323, NOW() - INTERVAL '2 minutes', NOW() - INTERVAL '2 minutes' + INTERVAL '323 seconds'),
    (3, 4, 'completed', 765, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes' + INTERVAL '765 seconds'),
    (2, 1, 'missed', 0, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
    (4, 3, 'active', 197, NOW() - INTERVAL '3 minutes', NULL)
ON CONFLICT DO NOTHING;