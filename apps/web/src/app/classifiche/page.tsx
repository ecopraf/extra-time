import { redirect } from "next/navigation";

// Vista consolidata nella pagina Campionati (design: pagina competizione unica).
export default function Page() {
  redirect("/campionati");
}
