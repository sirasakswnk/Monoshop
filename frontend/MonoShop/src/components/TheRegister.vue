<template>
    <div class="register-container">
        <div class="register-wrapper">
            <div class="register-card">
                <!-- Header Section -->
                <div class="card-header">
                    <div class="logo-section">
                        <img src="/mono_img.png" alt="MonoCraft Logo" class="logo-img">
                        <h1 class="main-title">สร้างบัญชีใหม่</h1>
                        <p class="subtitle">สมัครสมาชิกเพื่อเข้าถึงโลกของ Art Toy ที่คุณรัก</p>
                    </div>
                </div>

                <!-- Form Section -->
                <form @submit.prevent="handleSubmit" class="register-form">
                    <div class="form-group">
                        <label for="mem_email" class="form-label">
                            <i class="bi bi-envelope"></i>
                            อีเมล
                        </label>
                        <input 
                            type="email" 
                            class="form-input" 
                            id="mem_email"
                            autocomplete="off" 
                            required 
                            placeholder="example@email.com" 
                            v-model.trim="mem_email"
                            :class="{ 'error': errors.email }"
                        >
                        <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
                    </div>

                    <div class="form-group">
                        <label for="mem_name" class="form-label">
                            <i class="bi bi-person"></i>
                            ชื่อบัญชี
                        </label>
                        <input 
                            type="text" 
                            class="form-input" 
                            id="mem_name"
                            autocomplete="off" 
                            required 
                            placeholder="ชื่อบัญชี" 
                            v-model.trim="mem_name"
                            :class="{ 'error': errors.name }"
                        >
                        <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
                    </div>

                    <div class="form-group">
                        <label for="mem_phonenumber" class="form-label">
                            <i class="bi bi-phone"></i>
                            เบอร์โทร
                        </label>
                        <input 
                            type="text" 
                            class="form-input" 
                            id="mem_phonenumber"
                            autocomplete="off" 
                            required 
                            placeholder="เบอร์โทรศัพท์" 
                            v-model.trim="mem_phonenumber"
                            :class="{ 'error': errors.phonenumber }"
                        >
                        <span v-if="errors.phonenumber" class="error-message">{{ errors.phonenumber }}</span>
                    </div>

                    <div class="form-group">
                        <label for="password" class="form-label">
                            <i class="bi bi-lock"></i>
                            รหัสผ่าน
                        </label>
                        <div class="password-wrapper">
                            <input 
                                :type="showPassword ? 'text' : 'password'" 
                                class="form-input" 
                                id="password"
                                autocomplete="off" 
                                required 
                                placeholder="สร้างรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                                v-model="mem_password_hash"
                                :class="{ 'error': errors.password }"
                            >
                            <button 
                                type="button" 
                                class="toggle-password" 
                                @click="showPassword = !showPassword"
                                tabindex="-1"
                            >
                                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                            </button>
                        </div>
                        <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
                    </div>

                    <button 
                        type="submit" 
                        class="btn-submit" 
                        :disabled="isSubmitting"
                    >
                        <span v-if="!isSubmitting">
                            <i class="bi bi-check-circle"></i>
                            ลงทะเบียน
                        </span>
                        <span v-else>
                            <i class="bi bi-arrow-repeat spinner"></i>
                            กำลังดำเนินการ...
                        </span>
                    </button>
                </form>

                <!-- Alert Messages -->
                <transition name="fade">
                    <div v-if="message" :class="['alert', regist ? 'alert-success' : 'alert-danger']">
                        <i :class="regist ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
                        <span>{{ message }}</span>
                    </div>
                </transition>

                <!-- Footer -->
                <div class="card-footer">
                    <p>มีบัญชีอยู่แล้ว? <router-link to="/login" class="link" >เข้าสู่ระบบ</router-link>
              </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();

const mem_email = ref('');
const mem_name = ref('');
const mem_password_hash = ref('');
const mem_phonenumber = ref('');
const regist = ref(null);
const message = ref('');
const showPassword = ref(false);
const isSubmitting = ref(false);
const errors = ref({
    email: '',
    name: '',
    phonenumber: '',
    password: ''
});

const validateForm = () => {
    let isValid = true;
    errors.value = { email: '', name: '', phonenumber: '', password: '' };

    if (!mem_email.value) {
        errors.value.email = 'กรุณากรอกอีเมล';
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mem_email.value)) {
        errors.value.email = 'รูปแบบอีเมลไม่ถูกต้อง';
        isValid = false;
    }

    if (!mem_name.value) {
        errors.value.name = 'กรุณากรอกชื่อ-นามสกุล';
        isValid = false;
    } else if (mem_name.value.length < 2) {
        errors.value.name = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
        isValid = false;
    }
    
    if (!mem_phonenumber.value) {
        errors.value.phonenumber = 'กรุณาเบอร์โทรศัพท์';
        isValid = false;
    } else if (mem_phonenumber.value.length !== 10) {
        errors.value.phonenumber = 'เบอร์จำนวนไม่ถูกต้อง';
        isValid = false;
    }

    if (!mem_password_hash.value) {
        errors.value.password = 'กรุณากรอกรหัสผ่าน';
        isValid = false;
    } else if (mem_password_hash.value.length < 6) {
        errors.value.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
        isValid = false;
    }

    return isValid;
};

const handleSubmit = async () => {
    if (!validateForm()) {
        return;
    }

    isSubmitting.value = true;
    message.value = '';

    let members = {
        mem_email: mem_email.value.trim().toLowerCase(),
        mem_name: mem_name.value.trim(),
        mem_password_hash: mem_password_hash.value,
        mem_phonenumber:mem_phonenumber.value
    };

    try {
        const response = await axios.post(`http://localhost:3000/members`, members);
        console.log(response.data);
        regist.value = response.data.register;
        message.value = response.data.message || 'ลงทะเบียนสำเร็จ!';
        
        if (regist.value) {
            // Clear form on success
            setTimeout(() => {
                router.push('/login');
            }, 1000);
        }
    } catch (err) {
        console.error(err);
        regist.value = false;
        message.value = err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style scoped>
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css');

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
.logo-img {
  width: 40%;
  max-width: 400px;
  height: auto;
  border-radius: 50%;
  object-fit: contain;
  animation: float 5s ease-in-out infinite;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0.2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.register-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.register-wrapper {
    width: 100%;
    max-width: 480px;
}

.register-card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
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

.card-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px 30px 30px;
    color: white;
    text-align: center;
}

.logo-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.logo-icon {
    font-size: 48px;
    margin-bottom: 10px;
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

.main-title {
    font-size: 28px;
    font-weight: 700;
    margin: 0;
}

.subtitle {
    font-size: 14px;
    opacity: 0.9;
    margin: 0;
}

.register-form {
    padding: 30px;
}

.form-group {
    margin-bottom: 24px;
}

.form-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
}

.form-label i {
    color: #667eea;
}

.form-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    font-size: 15px;
    transition: all 0.3s ease;
    background: #f8f9fa;
}

.form-input:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.form-input.error {
    border-color: #ef4444;
}

.password-wrapper {
    position: relative;
}

.toggle-password {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    transition: color 0.3s;
}

.toggle-password:hover {
    color: #667eea;
}

.error-message {
    display: block;
    color: #ef4444;
    font-size: 12px;
    margin-top: 6px;
    margin-left: 4px;
}

.btn-submit {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 10px;
}

.btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-submit:active:not(:disabled) {
    transform: translateY(0);
}

.btn-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.spinner {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.alert {
    margin: 20px 30px 0;
    padding: 14px 16px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 500;
}

.alert-success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #6ee7b7;
}

.alert-danger {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
}

.alert i {
    font-size: 18px;
}

.fade-enter-active, .fade-leave-active {
    transition: all 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.card-footer {
    padding: 20px 30px 30px;
    text-align: center;
    color: #666;
    font-size: 14px;
}

.link {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.3s;
}

.link:hover {
    color: #764ba2;
    text-decoration: underline;
}

@media (max-width: 576px) {
    .register-container {
        padding: 10px;
    }

    .card-header {
        padding: 30px 20px 25px;
    }

    .main-title {
        font-size: 24px;
    }

    .register-form {
        padding: 25px 20px;
    }

    .alert {
        margin: 15px 20px 0;
    }

    .card-footer {
        padding: 15px 20px 25px;
    }
}
</style>