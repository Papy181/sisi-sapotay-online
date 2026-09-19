(() => {
  let sb = null;
  function ready() {
    return !!(window.supabase && window.SISI_CLOUD &&
      SISI_CLOUD.SUPABASE_URL && SISI_CLOUD.SUPABASE_PUBLISHABLE_KEY);
  }
  function client() {
    if (!ready()) return null;
    if (!sb) {
      sb = window.supabase.createClient(
        SISI_CLOUD.SUPABASE_URL,
        SISI_CLOUD.SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
    }
    return sb;
  }
  async function clientPortal(no, phone) {
    const c = client();
    if (!c) throw new Error("Cloud not ready");
    const { data, error } = await c.rpc("client_portal", {
      p_client_no: no,
      p_phone: phone
    });
    if (error) throw error;
    return data;
  }
  window.SisiCloud = { ready, clientPortal };
})();