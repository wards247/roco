import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">洛克王国：世界 - 生蛋系统</h1>
        <nav className="nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            蛋组库
          </Link>
          <Link to="/pets" className={`nav-link ${isActive('/pets') ? 'active' : ''}`}>
            完整精灵库
          </Link>
          <Link to="/shiny" className={`nav-link ${isActive('/shiny') ? 'active' : ''}`}>
            异色
          </Link>
          <Link to="/my-pokemon" className={`nav-link ${isActive('/my-pokemon') ? 'active' : ''}`}>
            我的精灵
          </Link>
          <Link to="/breeding" className={`nav-link ${isActive('/breeding') ? 'active' : ''}`}>
            生蛋推荐
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
