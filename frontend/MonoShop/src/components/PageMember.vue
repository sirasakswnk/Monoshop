<template>
    <div class="member-container">
        <div class="profile-card">
            <div class="profile-header">
                <div class="avatar">
                    <span class="avatar-text">{{ getInitials() }}</span>
                </div>
                <h1 class="profile-title">Member Profile</h1>
                <span class="role-badge" :class="role?.toLowerCase()">{{ role }}</span>
            </div>

            <div class="profile-content">
                <div class="content-grid">
                    <!-- Left Column - Image Upload -->
                    <div class="left-column">
                        <div class="image-preview">
                            <img v-if="imgOK" 
                                 :src="`${API_BASE_URL}/img_mem/${mem_email}.jpg?timestamp=${imageTimestamp}`" 
                                 :alt="mem_email"
                                 class="profile-image">
                            <img v-else 
                                 :src="`${API_BASE_URL}/img_mem/default.jpg`" 
                                 :alt="mem_email"
                                 class="profile-image">
                        </div>

                        <form @submit.prevent="uploadFile()" class="upload-form">
                            <div class="upload-controls">
                                <input class="file-input" 
                                       type="file" 
                                       id="formFile" 
                                       @change="onFileChange" 
                                       accept="image/*" 
                                       required />
                                <button class="btn btn-upload" type="submit">Upload</button>
                            </div>
                            
                            <div v-if="fileMessage" class="upload-message" 
                                 :class="fileMessage === 'Upload ไม่สำเร็จ' ? 'error' : 'success'">
                                {{ fileMessage }}
                            </div>
                        </form>
                    </div>

                    <!-- Right Column - Profile Information -->
                    <div class="right-column">
                        <div v-if="!isEditing" class="view-mode">
                            <div class="info-group">
                                <label class="info-label">EMAIL ADDRESS</label>
                                <p class="info-value">{{ mem_email }}</p>
                            </div>

                            <div class="info-group">
                                <label class="info-label">DISPLAY NAME</label>
                                <p class="info-value">{{ mem_name }}</p>
                            </div>

                            <div class="info-group">
                                <label class="info-label">ROLE</label>
                                <p class="info-value">{{ role }}</p>
                            </div>

                            <button @click="startEdit" class="btn btn-primary">
                                Edit Profile
                            </button>
                        </div>

                        <div v-else class="edit-mode">
                            <form @submit.prevent="saveChanges">
                                <div class="form-group">
                                    <label class="form-label">Email Address</label>
                                    <input type="email" v-model="editForm.mem_email" class="form-input" disabled />
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Display Name</label>
                                    <input type="text" v-model="editForm.mem_name" class="form-input" required />
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Role</label>
                                    <input type="text" v-model="editForm.role" class="form-input" :disabled="!isAdmin" />
                                    <small class="form-hint" v-if="!isAdmin">Role cannot be changed</small>
                                    <small class="form-hint" v-else>You can change the role as admin</small>
                                </div>

                                <div class="button-group">
                                    <button type="submit" class="btn btn-success" :disabled="isSaving">
                                        {{ isSaving ? 'Saving...' : 'Save Changes' }}
                                    </button>
                                    <button type="button" @click="cancelEdit" class="btn btn-secondary" :disabled="isSaving">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div v-if="message" class="message" :class="messageType">
                            {{ message }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import API_BASE_URL from '@/config/api';

axios.defaults.withCredentials = true;

const authStore = useAuthStore();

const member = ref(null);
const mem_email = ref(null);
const mem_name = ref(null);
const role = ref(null);
const login = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const message = ref('');
const messageType = ref('');
const imgOK = ref(false);
const fileMessage = ref(null);
const file = ref(null);
const imageTimestamp = computed(() => authStore.imageTimestamp);

// ตรวจสอบว่า user เป็น admin หรือไม่
const isAdmin = computed(() => {
    return role.value?.toLowerCase() === 'admin';
});

const editForm = reactive({
    mem_email: '',
    mem_name: '',
    role: ''
});

onMounted(async () => {
    await getMember();
    await chkImage();
});

const getMember = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/members/detail`);
        member.value = res.data;
        mem_email.value = member.value.mem_email;
        mem_name.value = member.value.mem_name;
        role.value = member.value.role;
        login.value = member.value.login;
    } catch (err) {
        showMessage('Failed to load member data', 'error');
    }
};

const chkImage = async () => {
    const image = new Image();
    image.src = `${API_BASE_URL}/img_mem/${mem_email.value}.jpg`;
    image.onload = () => {
        imgOK.value = true;
    };
    image.onerror = () => {
        imgOK.value = false;
    };
};

const onFileChange = async (e) => {
    file.value = e.target.files[0];
};

const uploadFile = async () => {
    if (!file.value) {
        fileMessage.value = "เลือก File เพื่อ Upload";
        return;
    }
    
    const formData = new FormData();
    formData.append("mem_email", mem_email.value);
    formData.append("file", file.value);
    
    try {
        const response = await axios.post(`${API_BASE_URL}/members/uploadimg`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        fileMessage.value = response.data.message;
        // อัพเดต imageTimestamp ใน store เพื่อให้ MainMenu อัพเดตด้วย
        authStore.updateImageTimestamp();
        await chkImage();
    } catch (err) {
        fileMessage.value = "Upload ไม่สำเร็จ";
    }
};

const getInitials = () => {
    if (!mem_name.value) return 'U';
    const names = mem_name.value.split(' ');
    if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
    }
    return mem_name.value.substring(0, 2).toUpperCase();
};

const startEdit = () => {
    editForm.mem_email = mem_email.value;
    editForm.mem_name = mem_name.value;
    editForm.role = role.value;
    isEditing.value = true;
    message.value = '';
};

const cancelEdit = () => {
    isEditing.value = false;
    message.value = '';
};

const saveChanges = async () => {
    isSaving.value = true;
    message.value = '';

    try {
        // สร้าง object สำหรับส่งข้อมูล
        const updateData = {
            mem_email: editForm.mem_email,
            mem_name: editForm.mem_name
        };

        // ถ้าเป็น admin ให้ส่ง role ไปด้วย
        if (isAdmin.value) {
            updateData.role = editForm.role;
        }

        const response = await axios.put(`${API_BASE_URL}/members/update`, updateData);

        mem_email.value = editForm.mem_email;
        mem_name.value = editForm.mem_name;
        
        // อัปเดต role ถ้าเป็น admin
        if (isAdmin.value) {
            role.value = editForm.role;
        }

        isEditing.value = false;
        showMessage(response.data.message || 'Profile updated successfully!', 'success');
    } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile. Please try again.';
        showMessage(errorMessage, 'error');
    } finally {
        isSaving.value = false;
    }
};

const showMessage = (msg, type) => {
    message.value = msg;
    messageType.value = type;
    setTimeout(() => {
        message.value = '';
    }, 5000);
};
</script>

<style scoped>
.member-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 30px 20px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.profile-card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 1000px;
    width: 100%;
    overflow: hidden;
}

.profile-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 30px;
    text-align: center;
    position: relative;
}

.avatar {
    width: 80px;
    height: 80px;
    background: white;
    border-radius: 50%;
    margin: 0 auto 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.avatar-text {
    font-size: 30px;
    font-weight: 700;
    color: #667eea;
}

.profile-title {
    color: white;
    font-size: 26px;
    font-weight: 700;
    margin: 0 0 12px 0;
}

.role-badge {
    display: inline-block;
    padding: 6px 20px;
    background: rgba(255, 193, 7, 0.9);
    border-radius: 20px;
    color: #333;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.role-badge.admin {
    background: rgba(255, 193, 7, 0.9);
}

.role-badge.user {
    background: rgba(255, 255, 255, 0.3);
    color: white;
}

.profile-content {
    padding: 35px 40px;
}

/* Grid Layout - Horizontal */
.content-grid {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 40px;
    align-items: start;
}

/* Left Column - Image Upload */
.left-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.image-preview {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    background: #f5f5f5;
}

.profile-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.upload-form {
    width: 100%;
}

.upload-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.file-input {
    width: 100%;
    padding: 10px 15px;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    font-size: 14px;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
}

.file-input:hover {
    border-color: #667eea;
}

.btn-upload {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 15px;
}

.btn-upload:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.upload-message {
    margin-top: 10px;
    padding: 10px;
    border-radius: 8px;
    font-size: 13px;
    text-align: center;
    animation: slideIn 0.3s ease;
}

.upload-message.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.upload-message.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

/* Right Column - Profile Info */
.right-column {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 320px;
}

/* View Mode */
.view-mode .info-group {
    margin-bottom: 25px;
}

.view-mode .info-group:last-of-type {
    margin-bottom: 30px;
}

.view-mode .info-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: #667eea;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
}

.view-mode .info-value {
    font-size: 18px;
    color: #333;
    font-weight: 500;
    margin: 0;
}

/* Edit Mode */
.edit-mode .form-group {
    margin-bottom: 20px;
}

.edit-mode .form-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
}

.edit-mode .form-input {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    font-size: 16px;
    transition: all 0.3s ease;
    box-sizing: border-box;
}

.edit-mode .form-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.edit-mode .form-input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
}

.edit-mode .form-hint {
    display: block;
    font-size: 12px;
    color: #999;
    margin-top: 5px;
}

/* Buttons */
.button-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 25px;
}

.btn {
    padding: 13px 20px;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn:hover:not(:disabled) {
    transform: translateY(-2px);
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-primary:hover:not(:disabled) {
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-success {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    color: white;
}

.btn-success:hover:not(:disabled) {
    box-shadow: 0 8px 20px rgba(17, 153, 142, 0.4);
}

.btn-secondary {
    background: #f5f5f5;
    color: #666;
}

.btn-secondary:hover:not(:disabled) {
    background: #e0e0e0;
}

/* Message */
.message {
    margin-top: 20px;
    padding: 15px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    animation: slideIn 0.3s ease;
}

.message.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.message.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

/* Animations */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive */
@media (max-width: 900px) {
    .content-grid {
        grid-template-columns: 1fr;
        gap: 30px;
    }

    .left-column {
        max-width: 320px;
        margin: 0 auto;
    }

    .right-column {
        min-height: auto;
    }
}

@media (max-width: 640px) {
    .member-container {
        padding: 20px 15px;
    }

    .profile-card {
        border-radius: 15px;
    }

    .profile-header {
        padding: 25px 20px;
    }

    .profile-title {
        font-size: 22px;
    }

    .profile-content {
        padding: 25px 20px;
    }

    .left-column {
        max-width: 100%;
    }

    .button-group {
        grid-template-columns: 1fr;
    }
}
</style>