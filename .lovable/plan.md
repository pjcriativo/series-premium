
# Centralizar CategoryRows no container max-w-7xl

## Resumo

Ajustar o componente CategoryRow e o container na Index para que as categorias de series fiquem centralizadas dentro do mesmo container `max-w-7xl` usado pelo Hero Slider, mantendo consistencia visual.

## Mudancas

### 1. Index.tsx - Envolver categorias no container centralizado

- O `div` que envolve as CategoryRows (linha 72) passara a ter as classes `w-full flex flex-col items-center`
- Adicionar um inner wrapper `max-w-7xl w-full` para limitar a largura

### 2. CategoryRow.tsx - Ajustar padding interno

- Remover o `px-4` do titulo e do scroll container, pois o padding sera controlado pelo container pai
- Manter o scroll horizontal funcional

## Detalhes Tecnicos

### Index.tsx (linhas 72-81)

Trocar:
```
<div className="mt-6 space-y-2">
```

Por:
```
<div className="mt-6 space-y-2 w-full flex justify-center">
  <div className="w-full max-w-7xl">
```

E fechar o div extra correspondente.

### CategoryRow.tsx

Manter `px-4` no componente para o padding interno (funciona bem dentro do container centralizado). Nenhuma mudanca necessaria no CategoryRow -- o container pai na Index cuidara da centralizacao.

| Arquivo | Acao |
|---------|------|
| `src/pages/Index.tsx` | Envolver categorias em container `max-w-7xl` centralizado |
