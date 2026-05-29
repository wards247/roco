import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const NAV_ITEMS = [
  { path: '/', icon: '📚', label: '蛋组库' },
  { path: '/pets', icon: '📋', label: '完整精灵库' },
  { path: '/shiny', icon: '✨', label: '异色' },
  { path: '/my-pokemon', icon: '⭐', label: '我的精灵' },
  { path: '/breeding', icon: '🥚', label: '生蛋推荐' },
];

const Header = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">
          <span className="logo__desktop">洛克王国：世界 - 生蛋系统</span>
          <span className="logo__mobile">洛克精灵库</span>
        </h1>
        <nav className="nav">
          {NAV_ITEMS.map(({ path, icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link ${isActive(path) ? 'active' : ''}`}
            >
              <span className="nav-link__icon">{icon}</span>
              <span className="nav-link__text">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
