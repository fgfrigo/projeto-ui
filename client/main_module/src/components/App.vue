<template>
  <div class="app">
    <header class="header">
      <h2>API Demo</h2>
      <button v-if="logged" class="btn" @click="logout" :disabled="busy">
        Logout
      </button>
    </header>

    <!-- LOGIN -->
    <section v-if="!logged" class="card login-box">
      <h3>Login</h3>

      <form class="form" @submit.prevent="login">
        <label class="field">
          <span>Usuário</span>
          <input
              ref="loginUserRef"
              v-model="username"
              autocomplete="username"
              required
          />
        </label>

        <label class="field">
          <span>Senha</span>
          <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
          />
        </label>

        <button class="btn primary" :disabled="busy">
          {{ busy ? "Entrando..." : "Login" }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </section>

    <!-- APP -->
    <section v-else class="content">
      <div class="topbar">
        <p>Logado como <b>{{ user }}</b></p>

        <div class="toolbar">
          <button class="btn" @click="reloadItems" :disabled="busy">
            {{ busy ? "Carregando..." : "Recarregar itens" }}
          </button>

          <button class="btn primary" @click="openCreate" :disabled="busy">
            + Novo item
          </button>

          <button class="btn" @click="clearSelection" :disabled="busy">
            Limpar seleção
          </button>
        </div>
      </div>

      <!-- GRID PRINCIPAL -->
      <div class="grid">
        <!-- ITENS -->
        <section class="card">
          <div class="card-title">
            <h3>Itens</h3>
            <span class="badge">{{ items.length }}</span>
          </div>

          <p v-if="busy" class="muted">Carregando itens...</p>

          <p v-else-if="items.length === 0" class="empty">
            Lista vazia. Clique em <b>+ Novo item</b>.
          </p>

          <ul v-else class="list">
            <li
                v-for="it in items"
                :key="it.id"
                class="row"
                :class="{ selected: selectedId === it.id }"
            >
              <button class="row-main" @click="selectItem(it)">
                <span class="name">{{ it.name }}</span>
                <span class="id">#{{ it.id }}</span>
              </button>

              <button
                  class="btn danger"
                  @click="deleteItem(it)"
                  :disabled="busy"
              >
                Apagar
              </button>
            </li>
          </ul>
        </section>

        <!-- FORM ITEM -->
        <section class="card">
          <div class="card-title">
            <h3>
              {{
                mode === "create"
                    ? "Criar item"
                    : mode === "edit"
                        ? "Editar item"
                        : "Seleção"
              }}
            </h3>
          </div>

          <p v-if="mode === 'none'" class="muted">
            Selecione um item ou clique em <b>+ Novo item</b>.
          </p>

          <form v-else class="form" @submit.prevent="saveItem">
            <label class="field">
              <span>Nome</span>
              <input
                  ref="itemNameRef"
                  v-model="formName"
                  required
              />
            </label>

            <div class="form-actions">
              <button class="btn primary" :disabled="busy">
                {{ busy ? "Salvando..." : mode === "create" ? "Criar" : "Salvar" }}
              </button>

              <button
                  class="btn"
                  type="button"
                  @click="clearSelection"
                  :disabled="busy"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      </div>

      <!-- VIA CEP -->
      <section class="card">
        <div class="card-title">
          <h3>Consulta CEP (ViaCEP)</h3>
        </div>

        <div class="form cep-form">
          <input
              ref="cepRef"
              :value="formatCep(cep)"
              placeholder="Digite um CEP (ex: 01001-000)"
              inputmode="numeric"
              autocomplete="postal-code"
              maxlength="9"
              @input="(e) => (cep = normalizeCep(e.target.value))"
          />
          <button
              class="btn primary"
              @click="buscarCep"
              :disabled="busyCep || !isCepValid"
          >
            {{ busyCep ? "Buscando..." : "Buscar CEP" }}
          </button>
        </div>

        <div v-if="cepResult" class="cep-result">
          <p>
            <b>{{ cepResult.logradouro }}</b>
          </p>
          <p>
            {{ cepResult.bairro }} — {{ cepResult.localidade }}/{{ cepResult.uf }}
          </p>
        </div>
      </section>

      <!-- STATUS -->
      <section class="card status">
        <div class="card-title">
          <h3>Status</h3>
        </div>
        <pre class="console">{{ output }}</pre>
      </section>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from "vue";

/* auth */
const logged = ref(false);
const user = ref("");

/* ui */
const busy = ref(false);
const busyCep = ref(false);
const error = ref("");
const output = ref("");

/* login */
const username = ref("");
const password = ref("");
const loginUserRef = ref(null);

/* items */
const items = ref([]);
const selectedId = ref(null);
const formName = ref("");
const mode = ref("none"); // none | create | edit
const itemNameRef = ref(null);

/* CEP */
const cep = ref("");
const cepResult = ref(null);
const cepRef = ref(null);


/* autofocus watchers */
watch(logged, async (v) => {
  if (!v) {
    await nextTick();
    loginUserRef.value?.focus();
  }
});

watch(mode, async (v) => {
  if (v === "create" || v === "edit") {
    await nextTick();
    itemNameRef.value?.focus();
  }
});

/* helpers */

function normalizeCep(value) {
  return value.replace(/\D/g, "").slice(0, 8);
}

function formatCep(value) {
  if (value.length <= 5) return value;
  return value.slice(0, 5) + "-" + value.slice(5);
}

const isCepValid = computed(() => cep.value.length === 8);

async function api(url, options = {}) {
  const res = await fetch(url, {
    credentials: "same-origin",
    ...options
  });

  if (res.status === 401) {
    logged.value = false;
    clearSelection();
    output.value = "401 - sessão inválida";
    return null;
  }

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

/* session */
async function checkSession() {
  const res = await fetch("/auth/me", { credentials: "same-origin" });
  if (!res.ok) return;
  const data = await res.json();
  logged.value = !!data.user;
  user.value = data.user?.username || "";
}

/* auth */
async function login() {
  busy.value = true;
  error.value = "";

  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ username: username.value, password: password.value })
  });

  const data = await res.json().catch(() => ({}));
  busy.value = false;

  if (!res.ok) {
    error.value = data.message || "Erro ao autenticar";
    return;
  }

  output.value = JSON.stringify(data, null, 2);
  password.value = "";
  await checkSession();
  await reloadItems();
}

async function logout() {
  busy.value = true;
  await fetch("/auth/logout", { method: "POST", credentials: "same-origin" });
  logged.value = false;
  items.value = [];
  clearSelection();
  busy.value = false;
}

/* CRUD */
async function reloadItems() {
  busy.value = true;
  const res = await api("/api/items");
  if (res?.ok) items.value = res.data || [];
  busy.value = false;
}

function openCreate() {
  mode.value = "create";
  selectedId.value = null;
  formName.value = "";
}

function selectItem(it) {
  mode.value = "edit";
  selectedId.value = it.id;
  formName.value = it.name;
}

function clearSelection() {
  mode.value = "none";
  selectedId.value = null;
  formName.value = "";
}

async function saveItem() {
  busy.value = true;

  if (mode.value === "create") {
    const res = await api("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName.value })
    });
    output.value = JSON.stringify(res?.data ?? {}, null, 2);
    await reloadItems();
    clearSelection();
  }

  if (mode.value === "edit" && selectedId.value) {
    const res = await api(`/api/items/${selectedId.value}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName.value })
    });
    output.value = JSON.stringify(res?.data ?? {}, null, 2);
    await reloadItems();
  }

  busy.value = false;
}

async function deleteItem(it) {
  if (!confirm(`Apagar item "${it.name}"?`)) return;
  busy.value = true;
  const res = await api(`/api/items/${it.id}`, { method: "DELETE" });
  output.value = JSON.stringify(res?.data ?? {}, null, 2);
  await reloadItems();
  clearSelection();
  busy.value = false;
}

/* ViaCEP */
async function buscarCep() {
  if (!isCepValid.value) {
    output.value = "CEP inválido — informe 8 dígitos numéricos";
    return;
  }

  busyCep.value = true;
  cepResult.value = null;

  const res = await api(`/api/cep/${cep.value}`);
  if (res?.ok) cepResult.value = res.data;

  output.value = JSON.stringify(res?.data ?? {}, null, 2);
  busyCep.value = false;
}


onMounted(async () => {
  await checkSession();
  if (!logged.value) {
    await nextTick();
    loginUserRef.value?.focus();
  } else {
    await reloadItems();
  }
});
</script>


<style scoped>
/* ===== Base ===== */
.app {
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
  color: #111;
  background: #fff;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

h2 {
  margin: 0;
  font-size: 28px;
  letter-spacing: -0.02em;
}

/* ===== Cards ===== */
.card {
  border: 1px solid #e6e6e6;
  border-radius: 14px;
  padding: 16px;
  background: #fff;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.card-title h3 {
  margin: 0;
  font-size: 20px;
}

.badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #e6e6e6;
  background: #f8f8f8;
  color: #333;
}

.badge.subtle {
  background: #fafafa;
  color: #444;
}

/* ===== Topbar ===== */
.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.who {
  margin: 0;
  font-size: 16px;
}

.toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* ===== Grid ===== */
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

/* ===== Buttons ===== */
.btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #cfcfcf;
  background: #fff;
  cursor: pointer;
  font-weight: 600;
  line-height: 1;
}

.btn:hover {
  background: #f6f6f6;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.primary {
  border-color: #111;
  background: #111;
  color: #fff;
}

.btn.primary:hover {
  background: #000;
}

.btn.danger {
  border-color: #c52a2a;
  background: #c52a2a;
  color: #fff;
}

.btn.danger:hover {
  background: #ab1f1f;
}

/* ===== Forms ===== */
.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span {
  font-size: 14px;
  color: #333;
}

input {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #d7d7d7;
  outline: none;
  font-size: 14px;
}

input:focus {
  border-color: #111;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
}

.form-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 2px;
}

/* ===== List ===== */
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}

.row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
  border: 1px solid #ededed;
  border-radius: 12px;
  padding: 8px;
  background: #fff;
}

.row.selected {
  border-color: #111;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06);
}

.row-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 10px;
  text-align: left;
}

.row-main:hover {
  background: #f7f7f7;
}

.name {
  font-weight: 700;
  color: #111;
}

.id {
  font-size: 13px;
  color: #666;
}

/* ===== Empty / Hint / Muted ===== */
.empty {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px dashed #ddd;
  background: #fafafa;
  color: #444;
}

.hint {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px dashed #ddd;
  background: #fafafa;
}

.muted {
  margin: 0;
  color: #555;
}

/* ===== Login ===== */
.login-box {
  max-width: 360px;
}

.error {
  margin: 0;
  color: #c33;
  font-weight: 600;
}

/* ===== Status (below) ===== */
.status {
  /* fica sempre abaixo do grid, evitando "layout shifting" */
}

.console {
  margin: 0;
  background: #0f0f10;
  color: #9ff;
  padding: 14px;
  border-radius: 12px;
  min-height: 140px; /* mantém a área estável visualmente */
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
