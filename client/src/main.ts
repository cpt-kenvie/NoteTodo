import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles.css'
// 导入Nunito字体
import '@fontsource/nunito/300.css'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/500.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import ToastPlugin from './plugins/toast'
import AuthLoader from './plugins/auth-loader'

const app = createApp(App)
app.use(router)
app.use(ToastPlugin)
app.use(AuthLoader)

app.mount('#app')
