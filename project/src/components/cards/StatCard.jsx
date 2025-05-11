import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi'

export default function StatCard({ title, value, subtitle, icon, trend, trendValue, color = 'primary' }) {
  const colorClasses = {
    primary: {
      bg: 'bg-primary-50 dark:bg-primary-900/20',
      text: 'text-primary-700 dark:text-primary-400',
      iconBg: 'bg-primary-100 dark:bg-primary-800',
      iconText: 'text-primary-600 dark:text-primary-300'
    },
    secondary: {
      bg: 'bg-secondary-50 dark:bg-secondary-900/20',
      text: 'text-secondary-700 dark:text-secondary-400',
      iconBg: 'bg-secondary-100 dark:bg-secondary-800',
      iconText: 'text-secondary-600 dark:text-secondary-300'
    },
    accent: {
      bg: 'bg-accent-50 dark:bg-accent-900/20',
      text: 'text-accent-700 dark:text-accent-400',
      iconBg: 'bg-accent-100 dark:bg-accent-800',
      iconText: 'text-accent-600 dark:text-accent-300'
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-800',
      iconText: 'text-green-600 dark:text-green-300'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-700 dark:text-yellow-400',
      iconBg: 'bg-yellow-100 dark:bg-yellow-800',
      iconText: 'text-yellow-600 dark:text-yellow-300'
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-800',
      iconText: 'text-red-600 dark:text-red-300'
    }
  }

  const classes = colorClasses[color] || colorClasses.primary

  return (
    <div className={`p-6 rounded-lg shadow-sm ${classes.bg}`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${classes.iconBg} mr-4`}>
          <span className={`text-2xl ${classes.iconText}`}>{icon}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
      </div>
      
      {subtitle && (
        <div className="mt-4 flex items-center">
          {trend && (
            <>
              {trend === 'up' ? (
                <FiTrendingUp className="mr-1 text-green-500" />
              ) : (
                <FiTrendingDown className="mr-1 text-red-500" />
              )}
              <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trendValue}
              </span>
              <span className="mx-1 text-xs text-gray-500">•</span>
            </>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</span>
        </div>
      )}
    </div>
  )
}