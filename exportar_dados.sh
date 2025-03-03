#!/bin/bash

# Configurações
DB_HOST="nups.c3o2qsaeqjve.us-east-2.rds.amazonaws.com"
DB_USER="admin"
DB_PASSWORD="senha12."
DB_NAME="nups_db"
DUMP_FILE="./dump.sql"

mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > $DUMP_FILE

# Verificar se o dump foi criado com sucesso
if [ $? -eq 0 ]; then
  echo "Dados exportados com sucesso para $DUMP_FILE."
else
  echo "Erro ao exportar dados."
  exit 1
fi