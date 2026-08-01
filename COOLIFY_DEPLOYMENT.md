# 🚀 Guia de Deploy no Coolify (MySQL Separado + Node.js + Vite)

Este guia orienta o passo a passo para publicar o **NutriEstoque** no seu painel **Coolify** utilizando parâmetros individuais de banco de dados (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

---

## 📁 1. Arquivos de Banco de Dados Gerados

- **`database.sql`**: Script SQL completo na raiz do projeto. Contém todas as tabelas (`User`, `Supplier`, `Product`, `Purchase`, `Batch`, `Dispatch`, `FractionedLabel`, `Loss`, `Department`, `Requester`), chaves estrangeiras, índices e a carga inicial (seed) de usuários e setores.

---

## 🗄️ 2. Passo 1: Criar o Banco de Dados MySQL no Coolify

1. No painel do **Coolify**, clique em **+ New Resource** -> **Database** -> **MySQL**.
2. Defina o nome do recurso como `mysql-nutri-estoque`.
3. Defina a senha do root (`MYSQL_ROOT_PASSWORD`) e crie o banco de dados `nutri_estoque`.
4. Importe o arquivo `database.sql` na aba SQL / Terminal do MySQL no Coolify:
   ```bash
   mysql -u root -p nutri_estoque < database.sql
   ```

---

## ⚙️ 3. Passo 2: Variáveis de Ambiente Separadas para o Server no Coolify

No Coolify, na aplicação Node.js do servidor (pasta `./server`), cadastre cada parâmetro de banco de dados individualmente no menu **Environment Variables**:

| Nome da Variável | Valor Exemplo / Recomendado | Descrição |
|---|---|---|
| `PORT` | `3001` | Porta do servidor API |
| `NODE_ENV` | `production` | Ambiente de produção |
| `DB_HOST` | `mysql-nutri-estoque` | Host / Nome do serviço MySQL no Coolify |
| `DB_PORT` | `3306` | Porta interna do MySQL |
| `DB_USER` | `root` | Usuário do MySQL |
| `DB_PASSWORD` | `sua_senha_mysql_aqui` | Senha cadastrada no MySQL |
| `DB_NAME` | `nutri_estoque` | Nome do banco de dados |
| `JWT_SECRET` | `nutri_estoque_senai_secret_key_2026` | Chave secreta de sessão/token |

> **Nota**: O backend monta a conexão automaticamente a partir das 5 variáveis acima (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

---

## 💻 4. Passo 3: Variáveis do Frontend (Vite)

No Coolify, na aplicação estática/Vite para o cliente (pasta `./client`):

| Nome da Variável | Valor Exemplo | Descrição |
|---|---|---|
| `VITE_API_URL` | `https://api-nutri.sua-escola.com.br` | URL pública do backend Express |

---

## 👤 5. Credenciais de Acesso Inicial do Sistema

Após rodar o script `database.sql`:

- **Administrador**: `admin@senai.br` / Senha: `admin123`
- **Nutricionista**: `nutri@senai.br` / Senha: `senai123`
