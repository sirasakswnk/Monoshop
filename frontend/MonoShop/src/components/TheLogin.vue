<template>
  <div class="login-page">
    <main>
      <div class="login-container">
        <div class="row-custom">
          <div class="logo-section">
            <img src="/mono_img.png" alt="MonoCraft Logo" class="logo-img">
          </div>
          
          <div class="form-section">
            <div class="login-header">
              <h1>ยินดีต้อนรับกลับ</h1>
              <p>เข้าสู่ระบบเพื่อใช้งาน MonoCraft</p>
            </div>

            <form @submit.prevent="handleSubmit()">
              <div class="form-group">
                <label for="loginName">อีเมล</label>
                <div class="input-wrapper">
                  <input 
                    type="email" 
                    id="loginName" 
                    v-model="loginName"
                    class="form-control"
                    autocomplete="off"
                    required 
                    autofocus
                  >
                  <span class="input-icon">📧</span>
                </div>
              </div>

              <div class="form-group">
                <label for="password">รหัสผ่าน</label>
                <div class="input-wrapper">
                  <input 
                    type="password" 
                    id="password" 
                    v-model="password"
                    class="form-control"
                    required
                  >
                </div>
              </div>

              <div class="button-group">
                <router-link to="/register" style="text-decoration: none;">
                  <button type="button" class="btn btn-register">
                    ❤️ ลงทะเบียนใหม่
                  </button>
                </router-link>
                <button type="submit" class="btn btn-login">
                  ✓ ตกลง
                </button>
              </div>
            </form>

            <!-- แสดงสถานะการ Login -->
            <div v-if="login && message" class="alert alert-success">
              <span class="alert-icon">✓</span>
              เข้าระบบสำเร็จ - {{ message }}
            </div>
            <div v-else-if="!login && message" class="alert alert-danger">
              <span class="alert-icon">✕</span>
              เข้าระบบผิดพลาด - {{ message }}
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

axios.defaults.withCredentials = true;

const authStore = useAuthStore();
const router = useRouter();

// ✅ เปลี่ยนจาก null เป็น "" (empty string)
const loginName = ref("");
const password = ref("");
const login = ref(false);
const message = ref("");
const isLoading = ref(false);

onMounted(async () => {
  await getMember();
  // ถ้า login เป็น true ก็ย้ายหน้า
  if (login.value) {
    router.push("/pagemember");
  }
});

const getMember = async () => {
  try {
    const response = await axios.get(`http://localhost:3000/members/detail`);
    login.value = response.data.login;
  } catch (err) {
    console.log("Not logged in yet:", err.message);
    login.value = false;
  }
};

const handleSubmit = async () => {
  // ป้องกันการ submit ซ้ำ
  if (isLoading.value) return;
  
  // รีเซ็ต message เดิม
  message.value = "";
  isLoading.value = true;
  
  let members = {
    mem_email: loginName.value.trim(), // trim เพื่อลบช่องว่าง
    mem_password_hash: password.value
  };
  
  try {
    const response = await axios.post(`http://localhost:3000/members/login`, members);
    console.log("Login response:", response.data);
    
    login.value = response.data.login;
    message.value = response.data.message;
    
    if (login.value) {
      // ✅ อัพเดท authStore
      authStore.login();
      
      // รอให้เห็น success message แล้วค่อย redirect
      setTimeout(() => {
        router.push('/pagemember');
      }, 1000);
    } else {
      // กรณี login ไม่สำเร็จแต่ API ไม่ throw error
      if (!message.value) {
        message.value = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      }
    }
  } catch (err) {
    console.error("Login error:", err);
    
    login.value = false;
    
    // ✅ แสดง error message ที่เข้าใจง่าย
    if (err.response) {
      // มี response จาก server
      if (err.response.status === 401 || err.response.status === 400) {
        message.value = err.response.data.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      } else if (err.response.status === 500) {
        message.value = "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์";
      } else {
        message.value = err.response.data.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
      }
    } else if (err.request) {
      // ส่ง request แต่ไม่ได้รับ response
      message.value = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
    } else {
      // ข้อผิดพลาดอื่นๆ
      message.value = "เกิดข้อผิดพลาด: " + err.message;
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Main Content */
main {
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.login-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 3rem;
  width: 100%;
  max-width: 1100px;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.row-custom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-img {
  width: 80%;
  max-width: 400px;
  height: auto;
  border-radius: 15%;
  object-fit: contain;
  animation: float 5s ease-in-out infinite;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0.2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.form-section {
  width: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  color: #2d3748;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: #718096;
  font-size: 0.95rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  color: #4a5568;
  font-weight: 500;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.input-wrapper {
  position: relative;
}

.form-control {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s;
  outline: none;
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  pointer-events: none;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  flex: 1;
  padding: 0.875rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-register {
  background: white;
  color: #e53e3e;
  border: 2px solid #e53e3e;
}

.btn-register:hover {
  background: #e53e3e;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
}

.btn-login {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Alert Messages */
.alert {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.alert-success {
  background: #c6f6d5;
  color: #22543d;
  border: 2px solid #48bb78;
}

.alert-danger {
  background: #fed7d7;
  color: #742a2a;
  border: 2px solid #f56565;
}

.alert-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

/* Responsive */
@media (max-width: 992px) {
  .row-custom {
    grid-template-columns: 1fr;
  }

  .logo-section {
    order: 2;
  }

  .form-section {
    order: 1;
  }

  .logo-img {
    width: 60%;
  }
}

@media (max-width: 768px) {
  .login-container {
    padding: 2rem 1.5rem;
  }

  .button-group {
    flex-direction: column;
  }

  .login-header h1 {
    font-size: 1.5rem;
  }
}
</style>