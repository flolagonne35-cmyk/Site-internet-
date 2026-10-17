/* ========== SUPABASE CLIENT ========== */
const SUPABASE_URL = 'https://yuyfurkzeomniwynfjyj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tLP59OmTBrU7nK-_aF4QXQ_HuPA3laN';
const sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ========== AUTH ========== */
function rolfAuthErrorFr(message) {
  const known = {
    'User already registered': 'Un compte existe déjà avec cet email.',
    'Invalid login credentials': 'Email ou mot de passe incorrect.',
    'Password should be at least 6 characters': 'Le mot de passe doit faire au moins 6 caractères.',
    'Email not confirmed': 'Confirme ton email avant de te connecter (vérifie ta boîte de réception).',
  };
  return known[message] || message;
}

async function rolfSignUp(email, password, displayName) {
  const { data, error } = await sbClient.auth.signUp({
    email, password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw new Error(rolfAuthErrorFr(error.message));
  return data;
}

async function rolfSignIn(email, password) {
  const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
  if (error) throw new Error(rolfAuthErrorFr(error.message));
  return data;
}

async function rolfSignOut() {
  await sbClient.auth.signOut();
}

async function rolfGetSession() {
  const { data } = await sbClient.auth.getSession();
  return data.session;
}

/* ========== LOYALTY ========== */
async function rolfGetLoyaltyBalance(userId) {
  const { data, error } = await sbClient
    .from('loyalty_balances')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) { console.error('loyalty balance:', error); return 0; }
  return data?.balance ?? 0;
}

/* ========== REVIEWS ========== */
async function rolfFetchReviews(productRef) {
  const { data, error } = await sbClient
    .from('reviews')
    .select('id, rating, body, created_at, profiles(display_name)')
    .eq('product_ref', productRef)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetch reviews:', error); return []; }
  return data || [];
}

async function rolfSubmitReview(productRef, rating, body) {
  const session = await rolfGetSession();
  if (!session) throw new Error('Connecte-toi pour laisser un avis.');
  const { error } = await sbClient.from('reviews').insert({
    product_ref: productRef, rating, body, user_id: session.user.id,
  });
  if (error) throw new Error(error.message);
}
