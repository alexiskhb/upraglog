import { useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { todayString } from "@/shared/model/dates"

export function IndexRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    void navigate({
      to: "/day/$date",
      params: { date: todayString() },
      replace: true,
    })
  }, [navigate])

  return null
}
