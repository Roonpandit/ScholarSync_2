import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <>
      <style>{`
        .not-found {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: #f3f4f6;
          padding: 1rem;
        }

        .not-found-content {
          text-align: center;
          background-color: white;
          border-radius: 0.5rem;
          padding: 3rem 2rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 100%;
        }

        .not-found h1 {
          font-size: 6rem;
          font-weight: 700;
          color: #3b82f6;
          line-height: 1;
          margin: 0;
        }

        .not-found h2 {
          font-size: 1.5rem;
          margin: 1rem 0;
          color: #1f2937;
        }

        .not-found p {
          color: #6b7280;
          margin-bottom: 2rem;
        }

        .back-home {
          display: inline-block;
          background-color: #3b82f6;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.3s ease;
          text-decoration: none;
        }

        .back-home:hover {
          background-color: #2563eb;
          color: white;
        }
      `}</style>
      <div className="not-found">
        <div className="not-found-content">
          <h1>404</h1>
          <h2>Page Not Found</h2>
          <p>The page you are looking for does not exist or has been moved.</p>
          <Link to="/" className="back-home">
            Back to Home
          </Link>
        </div>
      </div>
    </>
  )
}

export default NotFound