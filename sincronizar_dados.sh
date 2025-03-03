#!/bin/bash

# Exportar dados do banco de produção
/caminho/para/exportar_dados.sh

# Verificar se a exportação foi bem-sucedida
if [ $? -eq 0 ]; then
  # Importar dados no banco de desenvolvimento
  /caminho/para/importar_dados.sh
else
  echo "Erro ao exportar dados. A sincronização foi interrompida."
  exit 1
fi