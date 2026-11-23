import { ImageResponse } from "next/og";
export const size={width:64,height:64}; export const contentType="image/png";
export default function Icon(){return new ImageResponse(<div style={{background:"#2b4c7e",color:"#d9bb78",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,fontFamily:"serif"}}>م</div>,size)}
