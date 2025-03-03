#!/bin/bash

# Configurações
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD="1234"
DB_NAME="nups_db_dev"
DUMP_FILE="./dump.sql"


# Importar dados
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < $DUMP_FILE

# Verificar se a importação foi bem-sucedida
if [ $? -eq 0 ]; then
  echo "Dados importados com sucesso para $DB_NAME."
else
  echo "Erro ao importar dados."
  exit 1
fi