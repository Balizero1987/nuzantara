# Fix per tax.balizero.com - Istruzioni Complete

## Problema
GitHub Pages non funziona perché il branch name `"gh-pages-/-(root)"` è invalido.

## Soluzione
Applicare questa patch al repository `bali-zero-tax-dashbord`.

## Comandi da Eseguire

```bash
# 1. Clone del repository
git clone https://github.com/Balizero1987/bali-zero-tax-dashbord.git
cd bali-zero-tax-dashbord

# 2. Crea il branch gh-pages dal branch corrente
git checkout -b gh-pages

# 3. Applica la patch (file allegato: tax-fix.patch)
git am < ../tax-fix.patch

# 4. Push del nuovo branch
git push -u origin gh-pages

# 5. Elimina il branch vecchio (opzionale)
git push origin --delete "gh-pages-/-(root)"
```

## Configurazione GitHub Pages (via web)

Dopo il push, vai su:
https://github.com/Balizero1987/bali-zero-tax-dashbord/settings/pages

Configura:
- **Source**: Deploy from a branch
- **Branch**: gh-pages (NON "gh-pages-/-(root)")
- **Folder**: / (root)

Salva.

## Risultato Atteso

Dopo 2-3 minuti:
- DNS check diventa "successful" (era "in progress")
- https://tax.balizero.com è online

## File Modificati dalla Patch

1. `.github/workflows/statico.yml` - branch name corretto
2. `.github/workflows/jekyll-gh-pages.yml` - branch name corretto
3. `CNAME` - nuovo file con `tax.balizero.com`

## Note
- La patch è già committata e pronta
- Include il messaggio di commit appropriato
- Non richiede modifiche manuali ai file
