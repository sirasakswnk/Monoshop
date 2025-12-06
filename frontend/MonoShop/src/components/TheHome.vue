<template>
  <div class="home-page">
    <!-- 🔹 HERO SECTION -->
    <section class="hero-section">
      <div class="container-fluid px-4 px-lg-5">
        <!-- Animated Background Blobs -->
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>

        <div class="row align-items-center g-5 position-relative" style="z-index: 2;">
          <!-- Left Content -->
          <div class="col-lg-6">
            <div class="hero-badge mb-4">
              <span class="badge-icon">✨</span>
              <span>Premium Art Toy Collection</span>
            </div>
            <h1 class="hero-title mb-3">
              <span class="gradient-text">MonoCraft</span><br />
              <span class="Pre-text">Welcome to</span><br/>
              <span class="hero-subtitle">โลกของ Art Toy</span><br />
              <span class="hero-accent">สุดคูล ✨</span>
            </h1>

            <p class="hero-description mb-4">
              ค้นพบคอลเลกชันสุดพิเศษ ที่จะเติมเต็มความเป็นเอกลักษณ์ของคุณ
              <br />
              <span class="text-highlight">Limited Edition · Authentic · Collectible</span>
            </p>

            <div class="hero-buttons mb-4">
              <router-link to="/product" class="btn btn-primary-gradient">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path class="Cartimg" d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <span class="arrow">ดูสินค้าทั้งหมด →</span>
              </router-link>
            </div>

            <!-- Feature Badges -->
            <div class="feature-badges"> 
            </div>
          </div>

          <!-- Right Image -->
          <div class="col-lg-6">
            <div class="hero-image-wrapper">
              <div class="hero-glow"></div>
              <div class="hero-image-container">
                <img src="/Model.png" alt="Best Seller Model" class="hero-img" />
                
                <!-- Floating Badge -->
                <div class="floating-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <div>
                    <div class="badge-title">Best Seller</div>
                    <div class="badge-subtitle">Limited x 500</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 🔹 PRODUCTS SECTION -->
        <div id="product-section" class="products-section mt-5">
          <h2 class="section-title mb-5">
            ✨ สินค้าแนะนำ ✨
          </h2>

          <div class="row justify-content-center g-4">
            <div v-for="pd in products.slice(0, 3)" :key="pd.product_id" class="col-12 col-sm-6 col-lg-4">
              <div class="product-card">
                <!-- Product Image -->
                <div class="product-image-wrapper">
                  <img
                    :src="`${baseURL}/img_pd/${pd.product_id}.jpg`"
                    :alt="pd.productname"
                    class="product-image"
                    @error="onImgError"
                  />
                  
                  <!-- Details Button on Image (Show on Hover) -->
                  <router-link 
                  :to="{name:'ProductShow', params:{pdId:pd.product_id}}" class="btn-details-on-image">
                    ดูรายละเอียด
                  </router-link>
                </div>

                <!-- Product Info -->
                <div class="product-info">
                  <h3 class="product-name">{{ pd.productname }}</h3>
                  <p class="product-category">{{ pd.category || 'Art Toy Collection' }}</p>
                  <div class="product-price">{{ formatTHB(pd.price) }}</div>
                </div>

                <!-- Shine Effect -->
                <div class="shine-effect"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE || "http://localhost:3000";
const products = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await axios.get(`${baseURL}/products`);
    products.value = data;
  } catch (err) {
    console.error(err?.message || err);
  } finally {
    loading.value = false;
  }
});

function formatTHB(n) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n);
}

function onImgError(e) { 
  e.target.src = "/placeholder.png"; 
}

function addToCart(pd) { 
  console.log("add to cart", pd.product_id); 
}
</script>

<style scoped>
/* ===== Variables ===== */
:root {
  --violet-600: #7c3aed;
  --violet-700: #6d28d9;
  --purple-600: #9333ea;
  --pink-500: #ec4899;
  --gray-800: #1f2937;
  --gray-600: #4b5563;
}

/* ===== Page Background ===== */
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fef2f2 100%);
  position: relative;
  overflow: hidden;
}

/* ===== Hero Section ===== */
.hero-section {
  padding: 5rem 0;
  position: relative;
}

/* Animated Blobs */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: blob-animation 7s ease-in-out infinite;
  z-index: 0;
}

.blob-1 {
  width: 400px;
  height: 400px;
  background: rgba(124, 58, 237, 0.4);
  top: -100px;
  left: -100px;
}

.blob-2 {
  width: 350px;
  height: 350px;
  background: rgba(147, 51, 234, 0.4);
  top: -50px;
  right: -50px;
  animation-delay: 2s;
}

.blob-3 {
  width: 400px;
  height: 400px;
  background: rgba(236, 72, 153, 0.3);
  bottom: -100px;
  left: 50%;
  animation-delay: 4s;
}

@keyframes blob-animation {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

/* Hero Badge */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--violet-700);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
}

.badge-icon {
  font-size: 1rem;
}

/* Hero Title */
.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

.gradient-text {
  background: linear-gradient(135deg, var(--violet-600), var(--purple-600), var(--pink-500));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  color: var(--gray-800);
  font-size: 3rem;
}

.hero-accent {
  color: var(--gray-600);
  font-size: 2.5rem;
}

/* Hero Description */
.hero-description {
  font-size: 1.25rem;
  color: var(--gray-600);
  line-height: 1.8;
}

.text-highlight {
  color: var(--violet-600);
  font-weight: 600;
}

/* Hero Buttons */
.hero-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.btn-primary-gradient {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--violet-600), var(--purple-600));
  color: white;
  border: none;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 10px 25px rgba(124, 58, 237, 0.3);
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn-primary-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px rgba(124, 58, 237, 0.4);
  background: linear-gradient(135deg, #5a32a3 0%, #6f42c1 100%);
  
}

.btn-primary-gradient .arrow {
  display: inline-block;
  transition: transform 0.3s ease;
}

.btn-primary-gradient:hover .arrow {
  transform: translateX(4px);
  color: #f0e2f5;
}

.btn-secondary-glass {
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  color: var(--violet-700);
  border: 2px solid rgba(124, 58, 237, 0.3);
  border-radius: 1rem;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn-secondary-glass:hover {
  background: white;
  border-color: var(--violet-600);
}

/* Feature Badges */
.feature-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.feature-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(124, 58, 237, 0.15);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: var(--gray-600);
}
.Cartimg{
  stroke: rgb(20, 18, 18);
  fill: rgb(180, 131, 192);
}
.feature-badge svg {
  color: var(--violet-600);
}

/* Hero Image */
.hero-image-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(147, 51, 234, 0.3));
  border-radius: 2rem;
  filter: blur(60px);
  opacity: 0.5;
  transition: opacity 0.5s ease;
}
.hero-title {

  font-family: "Kanit", sans-serif;
  font-weight: 500;
  font-style: normal;
}
.hero-image-wrapper:hover .hero-glow {
  opacity: 0.7;
}

.hero-image-container {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 2rem;
  padding: 2rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
  transition: transform 0.5s ease;
}

.hero-image-wrapper:hover .hero-image-container {
  transform: scale(1.05);
}

.hero-img {
  width: 100%;
  max-width: 450px;
  height: auto;
  border-radius: 1.5rem;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

/* Floating Badge */
.floating-badge {
  position: absolute;
  top: -1rem;
  right: -1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4);
  transform: rotate(3deg);
  transition: transform 0.3s ease;
}
.arrow{
    font-weight: 700;
    font-size: 1rem;
    color: rgb(36, 35, 35);
}

.floating-badge:hover {
  transform: rotate(6deg);
}

.floating-badge svg {
  color: rgb(241, 240, 240);
}

.badge-title {
  font-weight: 700;
  font-size: 0.875rem;
  color: white;
  line-height: 1;
}

.badge-subtitle {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1;
}

/* ===== Products Section ===== */
.products-section {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.85));
  border: 1px solid rgba(124, 58, 237, 0.12);
  border-radius: 2rem;
  padding: 3rem 2rem;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  color: var(--gray-800);
}

/* Product Card */
.product-card {
  position: relative;
  background: rgb(246, 244, 244);
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  height: 100%;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

/* Product Image */
.product-image-wrapper {
  position: relative;
  background: linear-gradient(135deg, #faf5ff, #fff);
  padding: 1.5rem;
  overflow: hidden;
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 1rem;
  transition: transform 0.5s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

/* Details Button on Image */
.btn-details-on-image {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 0.875rem 2rem;
  background: white;
  color: #370443;
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  opacity: 0;
  transition: all 0.4s ease;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 5;
}

.product-card:hover .btn-details-on-image {
  opacity: 1;
}

.btn-details-on-image:hover {
  background: linear-gradient(135deg, #5a32a3 0%, #6f42c1 100%);
  color: #f0e2f5;
  transform: translate(-50%, -50%) scale(1.05);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

/* Product Info */
.product-info {
  padding: 1.5rem;
  background: white;
  text-align: left;
}

.product-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d0425;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.product-category {
  color: #af92c4;
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0 0 0.75rem 0;
}

.product-price {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Shine Effect */
.shine-effect {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transform: translateX(-100%) rotate(45deg);
  transition: transform 0.8s ease;
  pointer-events: none;
}

.product-card:hover .shine-effect {
  transform: translateX(100%) rotate(45deg);
}


/* ===== Responsive ===== */
@media (max-width: 992px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 2rem;
  }
  
  .hero-accent {
    font-size: 1.75rem;
  }
}
.hero-description {
    font-family: "Kanit", sans-serif;
    font-weight: 300;
    font-style: normal;
}

@media (max-width: 576px) {
  .hero-section {
    padding: 3rem 0;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1.5rem;
  }
  
  .hero-accent {
    font-size: 1.25rem;
  }
  
  .hero-buttons {
    flex-direction: column;
  }
  
  .btn-primary-gradient,
  .btn-secondary-glass {
    width: 100%;
    justify-content: center;
  }
  
  .product-image {
    height: 220px;
  }
  
  .floating-badge {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.5rem 0.75rem;
  }
  
}
</style>