import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:3000", // ajuste se usar outra porta
})

export default api
