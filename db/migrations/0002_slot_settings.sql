CREATE TABLE IF NOT EXISTS slot_settings (
  game TEXT PRIMARY KEY,
  win_chance REAL NOT NULL,
  max_bet INTEGER NOT NULL,
  updated INTEGER NOT NULL
);
