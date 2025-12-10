<template>
  <header class="nav-plant sticky-top">
    
    <nav class="navbar navbar-expand-lg py-2">
      <div class="container-fluid">
        <div class="nav-inner d-flex align-item-center gap-3 ">
          <!-- Leeft Brand -->
          <router-link to="/" class="navbar-brand d-flex align-items-center gap-2 me-lg-3">
            <img src="/mono_img.png" alt="MonoShop" class="brand-logo" />
            <span class="brand-text">MonoCraft</span>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Bitcount+Grid+Single:wght@100..900&family=Bitcount+Prop+Single+Ink:wght@100..900&display=swap" rel="stylesheet">
          </router-link>
        </div>

        <div class="collapse navbar-collapse" id="navMain">
          <!-- Center: Menu -->
          <ul class="navbar-nav nav-center d-none d-lg-flex flex-grow-1
         justify-content">
            <li class="nav-item">
              <router-link to="/" class="nav-link plant-link">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/product" class="nav-link plant-link">Products</router-link>
            </li>
            <li class="nav-item" v-if="login">
              
          </li>
          </ul>

          <!-- Center: Search (desktop) -->
          <form class="searchbar d-none d-lg-flex ms-lg-3" @submit.prevent="performSearch">
            <i class="bi bi-search"></i>
            <input v-model="q" type="text" class="form-control" placeholder="ค้นหาสินค้าที่คุณต้องการ..." />
          </form>

          <!-- Right: actions -->
          <ul class="navbar-nav ms-lg-3 align-items-center gap-2">
            <li v-if="!login" class="nav-item">
              <router-link to="/login" class="btn btn-success rounded-pill px-3">
                <i class="bi bi-box-arrow-in-right me-1"></i> Login
              </router-link>
            </li>

            <li class="nav-item  pe-3" v-if="login">
              <CartInfo />
            </li>
            

            <li v-if="login" class="nav-item dropdown">
              <a class="nav-link dropdown-toggle d-flex align-items-center gap-2 plant-account" href="#" role="button"
                data-bs-toggle="dropdown" aria-expanded="false">
                <img
                  :key="authStore.imageTimestamp"
                  :src="profileImageUrl"
                  :alt="mem_email || 'profile image'"
                  class="avatar"
                  @error="handleImageError"
                >
                <span class="d-none d-lg-inline">{{ mem_name }}</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                <li>
                  <router-link to="/pagemember" class="dropdown-item d-flex align-items-center gap-2">
                    <i class="bi bi-person-circle"></i> Profile
                  </router-link>
                </li>
                <li>
                  <router-link to="/orders" class="dropdown-item d-flex align-items-center gap-2">
                    <i class="bi bi-receipt"></i> Orders
                  </router-link>
                </li>
                <li v-if="isAdmin">
                  <router-link to="/admin/orders" class="dropdown-item d-flex align-items-center gap-2">
                    <i class="bi bi-shield-check"></i> Admin Orders
                  </router-link>
                </li>
                <li>
                  <hr class="dropdown-divider" />
                </li>
                <li>
                  <button class="dropdown-item text-danger d-flex align-items-center gap-2" @click="memLogout">
                    <i class="bi bi-box-arrow-right"></i> Logout
                  </button>
                </li>
              </ul>
            </li>
          </ul>

          <!-- Mobile expandable search -->
          <transition name="slide-fade">
            <form v-if="toggleSearch" class="searchbar w-100 d-lg-none mt-2" @submit.prevent="performSearch">
              <i class="bi bi-search"></i>
              <input v-model="q" type="text" class="form-control" placeholder="Search..." />
            </form>
          </transition>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import axios from "axios";
import CartInfo from "./CartInfo.vue";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { useRouter, useRoute } from "vue-router";
import API_BASE_URL from "@/config/api";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const login = ref(false);
const mem_name = ref(null);
const mem_email = ref(null);
const member = ref(null);
const role = ref(null);
const imgOK = ref(true);
const q = ref("");
const toggleSearch = ref(false);
const defaultAvatarUrl = `${API_BASE_URL}/img_mem/default.jpg`;
const cartStore = useCartStore();
const cartCount = computed(() => cartStore.displayQty || 0);
const isAdmin = computed(() => role.value === "admin");

const profileImageUrl = computed(() => {
  if (imgOK.value && mem_email.value) {
    return `${API_BASE_URL}/img_mem/${mem_email.value}.jpg?timestamp=${authStore.imageTimestamp}`;
  }
  return defaultAvatarUrl;
});

const handleImageError = () => {
  if (imgOK.value) {
    imgOK.value = false;
  }
};

axios.defaults.withCredentials = true;

watch(
  () => authStore.isLogin,
  (newValue) => {
    login.value = newValue;
    if (newValue) {
      if (!member.value) {
        getMember();
      }
    } else {
      clearMemberData();
    }
  }
);

watch(
  () => authStore.imageTimestamp,
  () => {
    // Force re-render and retry loading when profile image was updated
    imgOK.value = true;
  }
);

const getMember = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/members/detail`);

    if (response.data.login) {
      member.value = response.data;
      mem_email.value = response.data.mem_email;
      mem_name.value = response.data.mem_name;
      role.value = response.data.role;
      imgOK.value = true;
      authStore.updateImageTimestamp();
      login.value = true;
      if (!authStore.isLogin) {
        authStore.login();
      }
    } else {
      clearMemberData();
      if (authStore.isLogin) {
        authStore.logout();
      }
    }
  } catch (err) {
    if (err.response?.status === 401) {
      clearMemberData();
      if (authStore.isLogin) {
        authStore.logout();
      }
    } else {
      clearMemberData();
      if (authStore.isLogin) {
        authStore.logout();
      }
    }
  }
};

const clearMemberData = () => {
  login.value = false;
  mem_email.value = null;
  mem_name.value = null;
  role.value = null;
  member.value = null;
  imgOK.value = false;
  cartStore.setDisplayQty(0);
};

const memLogout = async () => {
  const cf = window.confirm("ต้องการออกจากระบบ?");
  if (cf) {
    try {
      await axios.get(`${API_BASE_URL}/members/logout`);
      clearMemberData();
      authStore.logout();
      router.push("/");
    } catch (err) {
      clearMemberData();
      authStore.logout();
      router.push("/");
    }
  }
};

const syncSearchFromRoute = () => {
  q.value = route.query.q ? String(route.query.q) : "";
};

const performSearch = () => {
  const keyword = q.value.trim();
  if (!keyword) {
    router.push("/product");
  } else {
    router.push({ path: "/product", query: { q: keyword } });
  }
  if (toggleSearch.value) {
    toggleSearch.value = false;
  }
};

onMounted(async () => {
  login.value = authStore.isLogin;
  syncSearchFromRoute();
  await getMember();
});

watch(
  () => route.query.q,
  () => {
    syncSearchFromRoute();
  }
);

</script>

<style scoped>
/* ================== Theme ================== */
:root {
  --plant-purple: #5a32a3;
  --plant-purple-2: #cb84e5;
  /* สี hover */
  --plant-mint: #f4edff;
  /* พื้นหลังอ่อน */
  --ink: #5a32a3;
}

.nav-plant {
  background: rgba(255, 255, 255, .8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(90, 50, 163, .12);
  box-shadow: 0 4px 16px rgba(90, 50, 163, .06);
}

/* Brand */
.brand-logo {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 0 0 2px var(--plant-mint) inset;
}

.brand-text {
  font-weight: 800;
  color: var(--ink);
  letter-spacing: .2px;
}

/* ลิงก์ใน Navbar */
.nav-link.plant-link {
  color: var(--ink);
  padding: .5rem .75rem;
  position: relative;
}

.nav-link.plant-link::after {
  content: "";
  position: absolute;
  left: .75rem;
  right: .75rem;
  bottom: .25rem;
  height: 3px;
  border-radius: 2px;
  background: var(--plant-purple);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform .2s ease;
}

.nav-link.plant-link:hover,
.router-link-active.nav-link.plant-link {
  color: var(--plant-purple);
}

.nav-link.plant-link:hover::after,
.router-link-active.nav-link.plant-link::after {
  transform: scaleX(1);
}

/* Search */
.searchbar {
  align-items: center;
  display: flex;
  gap: .5rem;
  background: #f4f0f7;
  border: 1px solid rgba(90, 50, 163, .25);
  padding: .3rem .5rem;
  border-radius: 50px;
  min-width: 300px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
}

.searchbar i {
  color: #5a32a3;
  font-size: 1.2rem;
  margin-right: 0.75rem;
}

.searchbar .form-control {
  border: none;
  background: transparent;
  outline: none;
  box-shadow: none;
  padding: 0;
  font-size: 0.95rem;
}

.searchbar:hover {
  background: #f4f0f7;
  border: 1px solid rgba(90, 50, 163, 1);
  transform: scale(1.025);
}

/* Right icons */
.icon-btn {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  border: 1px solid rgba(46, 125, 50, .15);
  background: #fff;
  color: var(--ink);
  transition: all .15s ease;
}

.icon-btn:hover {
  color: #5a32a3;
  background: var(--plant-purple);
  border-color: var(--plant-purple);
}

.badge-count {
  position: absolute;
  top: -4px;
  right: -6px;
  font-size: .7rem;
  padding: .05rem .35rem;
  border-radius: 999px;
  background: #582e7d;
  color: #ffffff;
  border: 2px solid #fff;
}

.btn-success {
  background: #6f42c1;
  /* สีม่วงอ่อนแบบ MonoCraft */
  border-color: #6f42c1;
  color: #ffffff;
}

.btn-success:hover {
  background: #cb84e5;
  /* สีตอน hover */
  border-color: #5a32a3;
}

.btn-logout {
  background: #6f42c1;
  /* สีม่วงอ่อนแบบ MonoCraft */
  border-color: #6f42c1;
  color: #ffffff;
}

.btn-logout:hover {
  background: #cb84e5;
  /* สีตอน hover */
  border-color: #5a32a3;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
}

.plant-account {
  padding: 8px 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
  text-decoration: none;
  color: #333;
  font-size: 18px;
  font-weight: 500;
}

.plant-account:hover {
  background-color: #f0e2f5;
  color: #580275;
  
}

.plant-account:hover .avatar {
  border-color: #5a32a3;
  transform: scale(1.05);
}

.dropdown-menu {
  border: none;
  border-radius: 16px;
  padding: 10px 8px;
  margin-top: 5px;
  min-width: 200px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  padding: 10px 5px;
  border-radius: 10px;
  margin: 4px 0;
  transition: all 0.2s ease;
  font-size: 15px;
  font-weight: 650;
}

.dropdown-item:hover {
  background-color: #f0e2f5;
  transform: translateX(4px);
  color: #5a32a3;
}

.dropdown-item i {
  font-size: 18px;
  width: 24px;
  text-align: center;
  opacity: 0.8;
}

.dropdown-item:hover i {
  opacity: 1;
}

/* Logout Button Specific Styling */
.dropdown-item.text-danger {
  color: #dc3545 ;
}

.dropdown-item.text-danger:hover {
  background-color: #fff0f0;
  color: #c82333 ;
}

/* Divider Styling */
.dropdown-divider {
  margin: 12px 8px;
  opacity: 0.15;
}

/* Admin Badge/Item Special Styling */
.dropdown-item:has(.bi-shield-check) {
  background: linear-gradient(135deg, #f0e2f5 0%, #e9ecef 100%);
}

.dropdown-item:has(.bi-shield-check):hover {
  background: linear-gradient(135deg, #5a32a3 0%, #6f42c1 100%);
  color: #f0e2f5;
}

/* Mobile search transition */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all .2s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}


  
.brand-text {
  font-family: "Bitcount Prop Single Ink", system-ui;
  font-weight: 700;
  font-style: normal;
  font-optical-sizing: auto;
}

</style>
