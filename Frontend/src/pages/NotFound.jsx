import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="not-found">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for does not exist or has been moved.</p>
        <Link to="/" className="back-home">
          Back to Home
        </Link>
      </div>
      <style jsx>{`
        .not-found {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: var(--gray-100);
          padding: 1rem;
        }
        
        .not-found-content {
          text-align: center;
          background-color: var(--white);
          border-radius: var(--border-radius);
          padding: 3rem 2rem;
          box-shadow: var(--box-shadow);
          max-width: 500px;
          width: 100%;
        }
        
        .not-found h1 {
          font-size: 6rem;
          font-weight: 700;
          color: var(--primary-color);
          line-height: 1;
          margin: 0;
        }
        
        .not-found h2 {
          font-size: 1.5rem;
          margin: 1rem 0;
          color: var(--gray-800);
        }
        
        .not-found p {
          color: var(--gray-600);
          margin-bottom: 2rem;
        }
        
        .back-home {
          display: inline-block;
          background-color: var(--primary-color);
          color: var(--white);
          padding: 0.75rem 1.5rem;
          border-radius: var(--border-radius);
          font-weight: 500;
          transition: var(--transition);
        }
        
        .back-home:hover {
          background-color: var(--primary-dark);
          color: var(--white);
        }
      `}</style>
    </div>
  )
}

export default NotFound