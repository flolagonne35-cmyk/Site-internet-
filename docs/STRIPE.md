# Activer le paiement Stripe — guide pour Florian

Tout le code est en place. Le bouton « Commander » affiche pour l'instant
« Le paiement en ligne ouvre très bientôt… ». Il reste 4 étapes à faire de ton côté,
puis Claude passe le site en mode paiement.

## 1. Créer le compte Stripe (≈ 15 min)

1. Va sur https://dashboard.stripe.com/register et crée le compte avec ton email pro.
2. Type d'entreprise : **Entreprise individuelle**. SIREN : **984 960 229**.
3. Renseigne l'IBAN du compte où tu veux recevoir l'argent et ta pièce d'identité.
4. Activité : « Vente au détail de montres et bijoux », site : l'adresse du site.

Tant que le compte n'est pas validé, tu peux tout tester en **mode test**
(interrupteur « Mode test » en haut du tableau de bord).

## 2. Régler Stripe (≈ 5 min)

- **Paramètres → Moyens de paiement** : active Carte, Apple Pay, Google Pay, et PayPal
  si tu veux le garder (le pied de page du site l'affiche).
- **Paramètres → Image de marque** : logo ROLF + couleur `#12352f` (la page de paiement prendra ce style).
- **Paramètres → Emails clients** : coche « Paiements réussis » pour que le client reçoive un reçu.
- **Paramètres → Notifications** (ton profil) : coche « Paiements réussis » pour recevoir un email à chaque vente.
- **Paramètres → Informations publiques** : nom affiché « ROLF », email contact@rolf.fr.

## 3. Récupérer les 2 clés et les mettre dans GitHub (≈ 5 min)

1. **Clé Stripe** : Stripe → Développeurs → Clés API → « Clé secrète » (`sk_test_…` en test,
   `sk_live_…` une fois le compte validé).
2. **Jeton Supabase** : https://supabase.com/dashboard/account/tokens → « Generate new token »
   (nom : `github-deploy`).
3. Sur GitHub : dépôt `Site-internet-` → **Settings → Secrets and variables → Actions →
   New repository secret**, deux fois :
   - `STRIPE_SECRET_KEY` = la clé Stripe
   - `SUPABASE_ACCESS_TOKEN` = le jeton Supabase
4. Onglet **Actions → Deploy checkout → Run workflow**. Le job doit finir en vert.

Ne colle jamais ces clés dans une conversation, un email ou un fichier du site.

## 4. Prévenir Claude

Dis « Stripe est prêt (test) » ou « Stripe est prêt (live) ». Claude active le bouton
« Commander », passe une commande de test et vérifie que tout s'enchaîne.

Pour passer du test au réel plus tard : remplace simplement le secret `STRIPE_SECRET_KEY`
par la clé `sk_live_…` et relance « Run workflow ».

---

## Comment ça marche (pour info)

- Le panier envoie seulement les **références, tailles et quantités** à une petite fonction
  hébergée chez Supabase (`supabase/functions/create-checkout`).
- La fonction relit **les prix et la disponibilité** dans `data/products.json` sur le site :
  impossible de payer un autre prix en bidouillant la page. Un produit épuisé est refusé,
  une bague sans taille aussi.
- Elle crée la page de paiement Stripe (adresse, téléphone, codes promo) et y renvoie le client.
- Après paiement : page « Merci pour votre commande » (`commande-confirmee.html`), panier vidé.
- **Tes commandes** : Stripe → Paiements. Chaque paiement indique les produits (avec la
  référence et la taille) et l'adresse de livraison.
- **Codes promo** : Stripe → Catalogue de produits → Coupons → créer un coupon puis un
  « code promotionnel ». Le champ code promo apparaît automatiquement au paiement.

## Frais de port

| Zone | Prix | Délai affiché |
|---|---|---|
| France (+ Monaco) | 4,90 €, offerts dès 80 € | 2 à 4 jours ouvrés |
| Union européenne | 14,90 € | 4 à 8 jours ouvrés |

À modifier à deux endroits si tu changes les tarifs : `SHIPPING` dans `js/main.js` et dans
`supabase/functions/create-checkout/index.ts` (plus les pages CGV / Livraison & retours).

## Frais Stripe

Environ 1,5 % + 0,25 € par carte européenne, rien d'autre (pas d'abonnement).
