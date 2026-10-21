import { createSlice } from "@reduxjs/toolkit";

const userSlice=createSlice({
    name:"user",
    initialState:{
      userData:null,
      isLoading: true,
    },
    reducers:{
        setUserdata:(state,action)=>{
            state.userData=action.payload;
            state.isLoading = false;
        },setAuthChecked: (state) => {    
            state.isLoading = false;
        }
    }
   
})

export const {setUserdata,setAuthChecked}=userSlice.actions 
export default userSlice.reducer
