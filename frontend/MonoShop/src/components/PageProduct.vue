<template>
  <div class="products-container">
    <div class="header-section">
      <h1 class="page-title">ผลิตภัณฑ์ของเรา</h1>
      <p v-if="searchTerm" class="search-term">
        <i class="bi bi-search"></i>
        ผลการค้นหา: "{{ searchTerm }}"</p>
    </div>

    <div v-if="loading" class="loading-state">
      กำลังโหลดข้อมูลสินค้า...
    </div>

    <div v-else class="products-grid">
      <div v-for="(pd, index) in products" :key="index" class="product-card-wrapper">
        <div class="product-card">
          <div class="image-container">
            <img 
              :src="`${API_BASE_URL}/img_pd/${pd.product_id}.jpg`" 
              class="product-image" 
              :alt="pd.productname"
              @error="handleImageError">
            <div class="overlay">
              <router-link 
                :to="{name:'ProductShow', params:{pdId:pd.product_id}}"
                class="view-detail-btn">
                ดูรายละเอียด
              </router-link>
            </div>
          </div>
          <div class="card-content">
            <h3 class="product-name">{{ pd.productname }}</h3>
            <p class="product-brand">{{ pd.brand?.brand_name || "ไม่ระบุยี่ห้อ" }}</p>
            <div class="price-section">
              <span class="price">฿{{ Number(pd.price).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && products.length === 0" class="no-products">
      <p v-if="searchTerm">ไม่พบสินค้าที่ตรงกับ "{{ searchTerm }}"</p>
      <p v-else>ไม่พบสินค้า</p>
    </div>
  </div> 
</template>

<script setup>
  import { onMounted, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import axios from 'axios';
  import API_BASE_URL from '@/config/api';
  axios.defaults.withCredentials = true

  const products = ref([]);
  const loading = ref(false);
  const searchTerm = ref('');
  const route = useRoute();

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
  }

  const syncQuery = () => {
    searchTerm.value = route.query.q ? String(route.query.q) : '';
  }

  const fetchProducts = async () => {
    loading.value = true;
    try {
      const keyword = searchTerm.value.trim();
      const url = keyword 
        ? `${API_BASE_URL}/products/search/${encodeURIComponent(keyword)}`
        : `${API_BASE_URL}/products`;
      const res = await axios.get(url);
      products.value = res.data;
    } catch (err) {
      console.log(err.message);
      products.value = [];
    } finally {
      loading.value = false;
    }
  }

  onMounted(async () => {
    syncQuery();
    await fetchProducts();
  })

  watch(
    () => route.query.q,
    async () => {
      syncQuery();
      await fetchProducts();
    }
  )
</script>

<style scoped>
.products-container {
  max-width: 1700px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #f9eafe 0%, #9d79a0 100%);
  min-height: 100vh;
  border-radius: 40px 24px;
  box-shadow: 0 10px 30px rgba(0.1, 0.1, 0.1, 0.2);
}

.header-section {
  position: relative;
  background: linear-gradient(135deg, #9d79a0 0%,#5a32a3 100%) ;
  padding: 50px 48px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0.1, 0.1, 0.1, 0.2);
  margin-bottom: 40px;
}

.header-content {
  position: relative;
  z-index: 1;
}

.page-title {
  font-family: "Prompt", sans-serif;
  font-weight: 700;
  font-size: 2.8rem;
  color: #ffffff;
  letter-spacing: 0.03em;
  text-align: center;
  margin: 0;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
  position: relative;
}

.search-term {
  text-align: center;
  margin-top: 16px;
  color: #ffffff;
  font-weight: 700;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0.95;
}

.search-icon {
  font-size: 1.1rem;
  color: #ffffff;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
  font-size: 1.1rem;
  color: #5a32a3;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);  /*repeat(auto-fill, minmax(300px, 1fr));*/
  gap: 30px;
  margin-top: 30px;
}

.product-card-wrapper {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.product-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  border-color: rgba(124, 58, 237, 0.2);
}

.image-container {
  position: relative;
  width: 100%;
  padding-top: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.1);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.product-card:hover .overlay {
  opacity: 1;
}

.view-detail-btn {
  padding: 12px 30px;
  background: white;
  color: #370443;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.view-detail-btn:hover {
  background: linear-gradient(135deg, #5a32a3 0%, #6f42c1 100%);
  color: #f0e2f5;
  transform: scale(1.05);
}

.card-content {
  padding: 25px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: #2d0425;
  margin-bottom: 5px;
  line-height: 1.3;
  min-height: 2.8rem;
}

.product-brand {
  color: #af92c4;
  font-size: 0.95rem;
  font-weight: 500;
  margin-bottom: 15px;
}

.price-section {
  margin-top: auto;
  padding-top: 15px;
  border-top: 2px solid #ecf0f1;
}

.price {
  font-size: 1.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.no-products {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  margin-top: 30px;
}

.no-products p {
  font-size: 1.3rem;
  color: #7f8c8d;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }
}
</style>