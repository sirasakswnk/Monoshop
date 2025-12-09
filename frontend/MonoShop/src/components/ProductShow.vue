<template>
    <div class="product-detail-container">
        <!-- Loading State -->
        <div v-if="products.length === 0" class="loading-container">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 text-muted">กำลังโหลดข้อมูลสินค้า...</p>
        </div>

        <!-- Product Detail -->
        <div v-for="(pd, index) in products" :key="pd.product_id || index" class="product-section">
            <div class="row g-4">
                <!-- Product Image Section -->
                <div class="col-lg-5 col-md-6">
                    <div class="image-container">
                        <div class="product-badge" v-if="pd.isNew">NEW</div>
                        <img 
                            :src="`${API_BASE_URL}/img_pd/${pd.product_id}.jpg`" 
                            :alt="pd.productname"
                            class="product-image"
                            @error="handleImageError"
                        >
                    </div>
                </div>

                <!-- Product Info Section -->
                <div class="col-lg-7 col-md-6">
                    <div class="product-info">
                        <!-- View Mode -->
                        <div v-if="!isEditing" class="view-mode">
                            <!-- Product Header -->
                            <div class="product-header">
                                <span class="product-id">รหัส: {{ pd.product_id }}</span>
                                <h1 class="product-name">{{ pd.productname }}</h1>
                                <div class="product-price">
                                    <span class="price-label">ราคา</span>
                                    <span class="price-value">฿{{ formatPrice(pd.price) }} </span>
                                </div>
                            </div>

                            <!-- Product Specifications -->
                            <div class="specifications">
                                <h3 class="spec-title">รายละเอียดสินค้า</h3>
                                
                                <div class="spec-grid">
                                    <div class="spec-item">
                                        <i class="bi bi-tag-fill"></i>
                                        <div class="spec-content">
                                            <span class="spec-label">ยี่ห้อ</span>
                                            <span class="spec-value">{{ pd.brand?.brand_name || "ไม่ระบุยี่ห้อ" }}</span>
                                        </div>
                                    </div>

                                    <div class="spec-item">
                                        <i class="bi bi-box-seam"></i>
                                        <div class="spec-content">
                                            <span class="spec-label">วัสดุ</span>
                                            <span class="spec-value">{{ pd.meterial }}</span>
                                        </div>
                                    </div>

                                    <div class="spec-item">
                                        <i class="bi bi-arrows-angle-expand"></i>
                                        <div class="spec-content">
                                            <span class="spec-label">ขนาด</span>
                                            <span class="spec-value">{{ pd.size }}</span>
                                        </div>
                                    </div>

                                    <div class="spec-item">
                                        <i class="bi bi-collection"></i>
                                        <div class="spec-content">
                                            <span class="spec-label">รุ่น</span>
                                            <span class="spec-value">{{ pd.serie?.series_name || "ไม่ระบุ" }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="description-box">
                                    <i class="bi bi-info-circle"></i>
                                    <div>
                                        <span class="spec-label">รายละเอียดเพิ่มเติม</span>
                                        <p class="description-text">{{ pd.description }}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="action-buttons">
                                <div class="qty-selector">
                                    <button type="button" class="btn-qty" @click="decrementQty" :disabled="isLoading || qtyToAdd <= 1">-</button>
                                    <span class="qty-value">{{ qtyToAdd }}</span>
                                    <button type="button" class="btn-qty" @click="incrementQty" :disabled="isLoading">+</button>
                                </div>
                                <button 
                                    class="btn btn-add-cart" 
                                    @click="chkLogin()" 
                                    :disabled="isLoading"
                                >
                                    <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
                                    <i v-else class="bi bi-cart-plus"></i>
                                    {{ isLoading ? 'กำลังเพิ่ม...' : 'เพิ่มลงตะกร้า' }}
                                </button>

                                <button 
                                    v-if="isAdmin" 
                                    class="btn btn-edit" 
                                    @click="startEdit(pd)"
                                >
                                    <i class="bi bi-pencil-square"></i>
                                    แก้ไขสินค้า
                                </button>
                            </div>
                        </div>

                        <!-- Edit Mode -->
                        <div v-else class="edit-mode">
                            <div class="edit-header">
                                <h2><i class="bi bi-pencil-square"></i> แก้ไขข้อมูลสินค้า</h2>
                            </div>

                            <form @submit.prevent="saveProduct" class="edit-form">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label><i class="bi bi-hash"></i> รหัสสินค้า</label>
                                        <input type="text" class="form-control" :value="pd.product_id" disabled>
                                        <small>ไม่สามารถแก้ไขรหัสสินค้าได้</small>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label><i class="bi bi-card-text"></i> ชื่อสินค้า *</label>
                                        <input type="text" class="form-control" v-model="editForm.productname" required>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label><i class="bi bi-currency-dollar"></i> ราคา *</label>
                                        <input type="number" class="form-control" v-model.number="editForm.price" min="0" step="0.01" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label><i class="bi bi-box-seam"></i> วัสดุ *</label>
                                        <input type="text" class="form-control" v-model="editForm.meterial" required>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label><i class="bi bi-arrows-angle-expand"></i> ขนาด *</label>
                                    <input type="text" class="form-control" v-model="editForm.size" required>
                                </div>
                                
                                <div class="form-group">
                                    <label><i class="bi bi-info-circle"></i> รายละเอียด *</label>
                                    <textarea class="form-control" v-model="editForm.description" rows="4" required></textarea>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label><i class="bi bi-tag"></i> ยี่ห้อ</label>
                                        <input type="text" class="form-control" :value="pd.brand?.brand_name || 'ไม่ระบุยี่ห้อ'" disabled>
                                        <small>ไม่สามารถแก้ไขยี่ห้อได้</small>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label><i class="bi bi-collection"></i> ประเภทสินค้า</label>
                                        <input type="text" class="form-control" :value="pd.product_type?.type_name || 'ไม่ระบุ'" disabled>
                                        <small>ไม่สามารถแก้ไขประเภทสินค้าได้</small>
                                    </div>
                                </div>
                                
                                <div v-if="message" class="alert-message" :class="messageType">
                                    <i class="bi" :class="messageType === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'"></i>
                                    {{ message }}
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-save" :disabled="isSaving">
                                        <span v-if="isSaving" class="spinner-border spinner-border-sm"></span>
                                        <i v-else class="bi bi-check-lg"></i>
                                        {{ isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข' }}
                                    </button>
                                    <button type="button" class="btn btn-cancel" @click="cancelEdit" :disabled="isSaving">
                                        <i class="bi bi-x-lg"></i>
                                        ยกเลิก
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref, computed, reactive } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import API_BASE_URL from '@/config/api';
axios.defaults.withCredentials = true;

// store
import { useCartStore } from '@/stores/cartStore';
const cartStore = useCartStore();

const route = useRoute();
const products = ref([]);
const id = ref(null);
const login = ref(false);
const mem_email = ref(null);
const role = ref(null);
const cartId = ref(null);
const backendMessage = ref(null);
const isLoading = ref(false);
const qtyToAdd = ref(1);
const isEditing = ref(false);
const isSaving = ref(false);
const message = ref('');
const messageType = ref('');

// Computed property เพื่อตรวจสอบว่าเป็น admin หรือไม่
const isAdmin = computed(() => {
    return role.value?.toLowerCase() === 'admin';
});

// Form สำหรับแก้ไขสินค้า
const editForm = reactive({
    productname: '',
    price: 0,
    meterial: '',
    size: '',
    description: ''
});

onMounted(async () => {
    id.value = route.params.pdId;
    
    // ตรวจสอบ role ของ user
    await checkUserRole();
    
    try {
        const res = await axios.get(`${API_BASE_URL}/products/${id.value}`);
        products.value = res.data;
    } catch (err) {
        console.error('Error loading product:', err.message);
        alert('ไม่สามารถโหลดข้อมูลสินค้าได้');
    }
});

// Helper method สำหรับ format ราคา
const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
};

// Helper method สำหรับจัดการ image error
const handleImageError = (event) => {
    event.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
};

// ตรวจสอบ role ของ user
const checkUserRole = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/members/detail`);
        login.value = res.data.login;
        mem_email.value = res.data.mem_email;
        role.value = res.data.role;
    } catch (err) {
        console.error('Error checking user role:', err);
        role.value = null;
    }
};

// เริ่มแก้ไข
const startEdit = (pd) => {
    if (!isAdmin.value) {
        alert('คุณไม่มีสิทธิ์แก้ไขสินค้า');
        return;
    }
    
    editForm.productname = pd.productname;
    editForm.price = pd.price;
    editForm.meterial = pd.meterial;
    editForm.size = pd.size;
    editForm.description = pd.description;
    isEditing.value = true;
    message.value = '';
};

// ยกเลิกการแก้ไข
const cancelEdit = () => {
    isEditing.value = false;
    message.value = '';
};

// บันทึกการแก้ไข
const saveProduct = async () => {
    if (!isAdmin.value) {
        alert('คุณไม่มีสิทธิ์แก้ไขสินค้า');
        return;
    }
    
    isSaving.value = true;
    message.value = '';
    
    try {
        const response = await axios.put(
            `http://localhost:3000/products/${id.value}`,
            {
                productname: editForm.productname,
                price: editForm.price,
                meterial: editForm.meterial,
                size: editForm.size,
                description: editForm.description
            }
        );
        
        // Refresh ข้อมูลสินค้าจาก server
        try {
            const res = await axios.get(`${API_BASE_URL}/products/${id.value}`);
            products.value = res.data;
        } catch (err) {
            console.error('Error refreshing product:', err);
            if (products.value && products.value.length > 0) {
                products.value[0].productname = editForm.productname;
                products.value[0].price = editForm.price;
                products.value[0].meterial = editForm.meterial;
                products.value[0].size = editForm.size;
                products.value[0].description = editForm.description;
            }
        }
        
        isEditing.value = false;
        message.value = response.data.message || 'แก้ไขสินค้าสำเร็จ';
        messageType.value = 'success';
        
        setTimeout(() => {
            message.value = '';
        }, 3000);
    } catch (err) {
        console.error('Error updating product:', err);
        const errorMsg = err.response?.data?.message || err.message || 'แก้ไขสินค้าไม่สำเร็จ';
        message.value = errorMsg;
        messageType.value = 'error';
    } finally {
        isSaving.value = false;
    }
};

// เมื่อ Click เพื่อเพิ่มสินค้า ตรวจสอบการ Login ก่อน
const chkLogin = async () => {
    if (isLoading.value) return;
    
    isLoading.value = true;
    
    try {
        const res = await axios.get(`${API_BASE_URL}/members/detail`);
        login.value = res.data.login;
        mem_email.value = res.data.mem_email;
        
        console.log('Login status:', login.value);

        if (login.value) {
            await chkCart();
            
            if (!cartId.value) {
                await addCart();
            }
            
            await addCartDtl();
            alert('เพิ่มสินค้าลงตะกร้าเรียบร้อย');
        } else {
            alert("ยังไม่ได้ Login ต้อง Login ก่อนซื้อสินค้า");
        }
    } catch (err) {
        console.error('Error in chkLogin:', err);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
        isLoading.value = false;
    }
};

// ตรวจสอบตะกร้าค้าง
const chkCart = async () => {
    
    const members = {
        mem_email: mem_email.value
    };
    
    try {
        const response = await axios.post(`${API_BASE_URL}/carts/chkcart`, members);
        
        if (response.data.cartExists) {
            cartId.value = response.data.cartId;
        }

    } catch (err) {
        console.error('Error in chkCart:', err);
    }
};

// สร้างตะกร้า
const addCart = async () => {
    
    const customer = {
        cusId: mem_email.value
    };
    
    try {
        const response = await axios.post(`${API_BASE_URL}/carts/addcart`, customer);
        
        backendMessage.value = response.data.messageAddCart;
        cartId.value = response.data.cartId || response.data.messageAddCart;
    } catch (err) {
        console.error('Error in addCart:', err);
        throw err;
    }
};

// เอาสินค้าใส่ตะกร้า
const addCartDtl = async () => {
    if (!products.value || products.value.length === 0) {
        throw new Error('ไม่พบข้อมูลสินค้า');
    }
    
    const cartdetail = {
        cartId: cartId.value,
        pdId: id.value,
        pdPrice: products.value[0].price,
        qty: qtyToAdd.value
    };
        
    try {
        const response = await axios.post(
            `${API_BASE_URL}/carts/addcartdtl`,
            cartdetail,
            { withCredentials: true }
        );
        
        // อัพเดท Store ด้วยจำนวนล่าสุดจาก backend
        const sumResponse = await axios.get(`${API_BASE_URL}/carts/sumcart/${cartId.value}`);
        const sumQty = Number(sumResponse.data?.qty) || 0;
        cartStore.setDisplayQty(sumQty);
        cartStore.setId(cartId.value);

        backendMessage.value = response.data.messageAddCartDtl;
    } catch (err) {
        console.error('Error in addCartDtl:', err);
        throw err;
    }
};

// ปรับจำนวนที่จะใส่ตะกร้า
const incrementQty = () => {
    qtyToAdd.value += 1;
};

const decrementQty = () => {
    if (qtyToAdd.value > 1) {
        qtyToAdd.value -= 1;
    }
};
</script>

<style scoped>
.product-detail-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem 1rem;
    min-height: 100vh;
    
}

/* Loading State */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
}

/* Product Section */
.product-section {
    background: white;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    margin-top: 2rem;
}

/* Image Container */
.image-container {
    position: relative;
    background: #f8f9fa;
    border-radius: 15px;
    overflow: hidden;
    padding: 1rem;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
}

.product-badge {
    position: absolute;
    top: 20px;
    left: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: bold;
    font-size: 0.875rem;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.product-image {
    width: 100%;
    height: auto;
    border-radius: 10px;
    transition: transform 0.3s ease;
}

.product-image:hover {
    transform: scale(1.05);
}

/* Product Info */
.product-info {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.view-mode {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

/* Product Header */
.product-header {
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 1.5rem;
}

.product-id {
    display: inline-block;
    background: #e3f2fd;
    color: #1976d2;
    padding: 0.4rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.product-name {
    font-size: 2rem;
    font-weight: 700;
    color: #2d3748;
    margin: 1rem 0;
    line-height: 1.3;
}

.product-price {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    margin-top: 1rem;
}

.price-label {
    font-size: 1rem;
    color: #718096;
    font-weight: 500;
}

.price-value {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Specifications */
.specifications {
    flex: 1;
}

.spec-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.spec-title::before {
    content: '';
    width: 4px;
    height: 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 2px;
}

.spec-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.spec-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 10px;
    transition: all 0.3s ease;
}

.spec-item:hover {
    background: #e9ecef;
    transform: translateY(-2px);
}

.spec-item i {
    font-size: 1.5rem;
    color: #667eea;
    margin-top: 0.25rem;
}

.spec-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
}

.spec-label {
    font-size: 0.875rem;
    color: #718096;
    font-weight: 500;
}

.spec-value {
    font-size: 1rem;
    color: #2d3748;
    font-weight: 600;
}

.description-box {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
    border-radius: 10px;
    border-left: 4px solid #667eea;
}

.description-box i {
    font-size: 1.5rem;
    color: #667eea;
    margin-top: 0.25rem;
}

.description-text {
    margin: 0.5rem 0 0 0;
    color: #4a5568;
    line-height: 1.6;
}

/* Action Buttons */
.action-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.qty-selector {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border: 2px solid #d9d1f2;
    border-radius: 10px;
    background: #f7f2ff;
}

.btn-qty {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%);
    color: #f8f5ff;
    font-weight: 700;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-qty:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-qty:not(:disabled):hover {
    background: linear-gradient(135deg, #7b55cf 0%, #6a3cb5 100%);
    transform: translateY(-1px);
}

.qty-value {
    min-width: 32px;
    text-align: center;
    font-weight: 700;
    font-size: 1.1rem;
    color: #3a1f6e;
}

.btn {
    padding: 1rem 2rem;
    border-radius: 10px;
    font-weight: 600;
    font-size: 1rem;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
}

.btn-add-cart {
    flex: 1;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-add-cart:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.btn-add-cart:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-edit {
    background: #fbbf24;
    color: #78350f;
    box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
}

.btn-edit:hover {
    background: #f59e0b;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(251, 191, 36, 0.4);
}

/* Edit Mode */
.edit-mode {
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.edit-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 10px;
    margin-bottom: 2rem;
}

.edit-header h2 {
    margin: 0;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.edit-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-weight: 600;
    color: #2d3748;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.form-group label i {
    color: #667eea;
}

.form-control {
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.form-control:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-control:disabled {
    background: #f7fafc;
    color: #a0aec0;
}

.form-group small {
    color: #718096;
    font-size: 0.875rem;
}

textarea.form-control {
    resize: vertical;
    min-height: 100px;
}

/* Alert Message */
.alert-message {
    padding: 1rem 1.5rem;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 500;
}

.alert-message i {
    font-size: 1.25rem;
}

.alert-message.success {
    background: #d1fae5;
    color: #065f46;
    border-left: 4px solid #10b981;
}

.alert-message.error {
    background: #fee2e2;
    color: #991b1b;
    border-left: 4px solid #ef4444;
}

/* Form Actions */
.form-actions {
    display: flex;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 2px solid #f0f0f0;
}

.btn-save {
    flex: 1;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.btn-save:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-cancel {
    background: #e5e7eb;
    color: #374151;
}

.btn-cancel:hover:not(:disabled) {
    background: #d1d5db;
    transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
    .product-detail-container {
        padding: 1rem 0.5rem;
    }

    .product-section {
        padding: 1rem;
        border-radius: 15px;
    }

    .product-name {
        font-size: 1.5rem;
    }

    .price-value {
        font-size: 2rem;
    }

    .spec-grid {
        grid-template-columns: 1fr;
    }

    .action-buttons {
        flex-direction: column;
    }

    .btn {
        width: 100%;
    }

    .form-row {
        grid-template-columns: 1fr;
    }

    .form-actions {
        flex-direction: column;
    }
}
</style>