import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { Empty } from '../components/ui'

export default function NotFound() {
  return <Empty icon={SearchX} text="Không tìm thấy trang này."><Link className="btn" to="/">Về Tổng quan</Link></Empty>
}
