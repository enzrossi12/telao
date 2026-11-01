---
name: fechar-fase
description: Checklist para concluir uma fase do docs/PLANO.md — roda typecheck e lint, confere os critérios de aceite, atualiza os checkboxes e faz o commit. Use quando terminar uma fase ou quando o usuário digitar /fechar-fase N.
---

# Fechar a fase $ARGUMENTS

1. Abra `docs/PLANO.md` e localize a fase indicada (se nenhum número foi passado, use a
   primeira fase com itens não marcados).
2. Para cada item da fase, confirme no código que ele foi feito. Liste os que faltam.
3. Rode na raiz:
   - `npm run typecheck`
   - `npm run lint`
   Corrija os erros antes de seguir.
4. Releia o bloco **Aceite** da fase. Para cada critério:
   - se der para verificar automaticamente, verifique;
   - se exigir teste manual (ex.: abrir duas instâncias, olhar o overlay), escreva para o
     usuário um roteiro curto de teste em português e **espere a confirmação dele**.
5. Só depois da confirmação: marque os checkboxes da fase em `docs/PLANO.md`.
6. Faça o commit: `chore: complete phase N - <nome da fase>`.
7. Resuma para o usuário em 3–5 linhas o que ficou pronto e qual é a próxima fase.
   Não comece a próxima fase sem ele pedir.
