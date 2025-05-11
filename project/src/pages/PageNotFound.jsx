import { Link } from 'react-router-dom'
import { FiHome } from 'react-icons/fi'

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-500">404</h1>
        <p className="mt-4 text-2xl font-semibold text-gray-800 dark:text-gray-200">Page not found</p>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Sorry, we couldn't find the page you're looking for.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <FiHome className="mr-2" />
          Go back home
        </Link>
      </div>
    </div>
  )
}