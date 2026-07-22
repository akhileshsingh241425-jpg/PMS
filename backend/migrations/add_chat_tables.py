from sqlalchemy import text
from models import db


def run():
    tables = [
        ('chat_conversations', '''
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type VARCHAR(10) NOT NULL DEFAULT 'direct',
            name VARCHAR(200),
            group_photo VARCHAR(500),
            created_by INTEGER NOT NULL REFERENCES users(id),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        '''),
        ('chat_conversation_participants', '''
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(20) DEFAULT 'member',
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_read_at DATETIME,
            UNIQUE(conversation_id, user_id)
        '''),
        ('chat_messages_new', '''
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
            sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message TEXT,
            message_type VARCHAR(20) DEFAULT 'text',
            file_url VARCHAR(500),
            file_name VARCHAR(255),
            file_size INTEGER,
            reply_to INTEGER REFERENCES chat_messages_new(id),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            edited_at DATETIME,
            deleted_at DATETIME
        '''),
        ('chat_message_status', '''
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id INTEGER NOT NULL REFERENCES chat_messages_new(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'sent',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(message_id, user_id)
        '''),
    ]

    for table_name, columns in tables:
        try:
            db.session.execute(text(f'SELECT 1 FROM {table_name} LIMIT 0'))
            print(f'  {table_name}: already exists')
        except Exception:
            sql = f'CREATE TABLE IF NOT EXISTS {table_name} ({columns})'
            db.session.execute(text(sql))
            db.session.commit()
            print(f'+ {table_name}: created')

    # Indexes
    indexes = [
        ('idx_conv_participants_conv', 'chat_conversation_participants', 'conversation_id'),
        ('idx_conv_participants_user', 'chat_conversation_participants', 'user_id'),
        ('idx_chat_messages_conv', 'chat_messages_new', 'conversation_id'),
        ('idx_chat_messages_sender', 'chat_messages_new', 'sender_id'),
        ('idx_chat_messages_reply', 'chat_messages_new', 'reply_to'),
        ('idx_msg_status_msg', 'chat_message_status', 'message_id'),
        ('idx_msg_status_user', 'chat_message_status', 'user_id'),
    ]
    for idx_name, table, column in indexes:
        try:
            db.session.execute(text(f'CREATE INDEX IF NOT EXISTS {idx_name} ON {table}({column})'))
            db.session.commit()
            print(f'  + index {idx_name}')
        except Exception as e:
            db.session.rollback()
            print(f'  {idx_name}: {e}')
