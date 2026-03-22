import { Outlet, useNavigate } from 'react-router-dom'

export default function Layout() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen w-full bg-white">
      <header className="w-full bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <span
          onClick={() => navigate('/history')}
          className="font-semibold text-sm tracking-wide text-gray-800 cursor-pointer hover:text-[#0F954D]"
        >
          EASYRICE TEST
        </span>
      </header>
      <main className="w-full px-4 sm:px-8 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  )
}
