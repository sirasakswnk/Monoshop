import { defineStore } from "pinia";
import {ref} from "vue"

export const useAuthStore = defineStore( 'auth',()=>{
    const isLogin =ref(false)
    const imageTimestamp = ref(Date.now())
    
    const login=()=>{
        isLogin.value=true
    }
    const logout=()=>{
        isLogin.value=false
    }
    
    const updateImageTimestamp=()=>{
        imageTimestamp.value = Date.now()
    }

    return {isLogin,imageTimestamp,login,logout,updateImageTimestamp }
})
