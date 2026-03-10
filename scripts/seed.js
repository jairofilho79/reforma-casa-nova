import { createHash, randomBytes } from 'crypto';

// Simple password hashing compatible with our server verification
// We use SHA-256 with a salt, stored as salt:hash
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

const user1Hash = hashPassword('ReformaCasa2024!');
const user2Hash = hashPassword('CasaNova2024!');

const sql = `
INSERT OR IGNORE INTO users (username, password_hash, name) VALUES
  ('jairo', '${user1Hash}', 'Jairo'),
  ('familia', '${user2Hash}', 'Família');

INSERT OR IGNORE INTO mudancas (id, name) VALUES
  (1, 'Reforma Casa Nova'),
  (2, 'Reforma Casa Velha');

INSERT OR IGNORE INTO services (name, materials_description, service_cost, status, selected, mudanca_id) VALUES
  ('Limpeza de Terreno', 'Limpeza dos matos', 150.00, 'pending', 1, 1),
  ('Elétrica', 'Troca de energia (fiação/quadro)', 350.00, 'pending', 1, 1),
  ('Pintura Geral', 'Cicatop 100 (1 cx grande), Massa Corrida (2 barricas), Massa Acrílica (2 barricas), 15 lixas (80), 5 lixas (120), 2 latas Coral Autolimpante Gelo (18L), Branco Neve (1L)', 2500.00, 'pending', 1, 1),
  ('Armário Cozinha', 'Reforma estrutural/ajustes', 250.00, 'pending', 1, 1),
  ('Vidro Cozinha', 'Vidro da porta (necessário orçar)', 0.00, 'pending', 1, 1),
  ('Caixa d''água', 'Limpeza e higienização', 250.00, 'pending', 1, 1),
  ('Portão', 'Tinta Cinza Médio (3 galões)', 400.00, 'pending', 1, 1),
  ('Limpeza Sótão', 'Higienização do espaço', 150.00, 'pending', 1, 1),
  ('Porta Sótão', 'Compra e instalação da porta', 250.00, 'pending', 1, 1),
  ('Reforma Sótão', '0,5m de areia, 25 latas de brita, 3 sacos de cimento (50kg)', 600.00, 'pending', 1, 1);
`;

process.stdout.write(sql);
