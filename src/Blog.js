// Blog.js
import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  Button,
  Form,
  Alert,
  Card,
  Spinner,
  Modal,
  Badge,
  Container,
  InputGroup,
  FormControl,
} from 'react-bootstrap';
import { Helmet } from 'react-helmet';
import { FaSearch, FaFire, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeContext';
import './styles.css';

const Blog = () => {
  const { theme } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollRef = useRef(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  // Get popular posts (sorted by views or likes)
  const popularPosts = [...posts]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 10);

  useEffect(() => {
    const q = query(collection(db, 'blogPosts'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() });
      });
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      post.title.toLowerCase().includes(searchLower) ||
      (post.content && post.content.toLowerCase().includes(searchLower)) ||
      (post.tags &&
        post.tags.some((tag) => tag.toLowerCase().includes(searchLower)))
    );
  });

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = scrollRef.current;
      setShowScrollButtons(scrollWidth > clientWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [posts]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className={`blog-container ${theme}`}>
      <Helmet>
        <title>Blog | Explore Our Latest Posts</title>
      </Helmet>

      {/* Popular Posts Horizontal Scroll */}
      <section className="popular-posts-section">
        <div className="container">
          <div className="d-flex align-items-center mb-3">
            <FaFire className="text-danger me-2" />
            <h5 className="mb-0">Popular Posts</h5>
          </div>

          <div className="position-relative">
            {showScrollButtons && (
              <button
                className="scroll-button left"
                onClick={() => scroll('left')}
              >
                <FaArrowLeft />
              </button>
            )}

            <div
              className="popular-posts-scroll"
              ref={scrollRef}
              onScroll={checkScroll}
            >
              {popularPosts.map((post) => (
                <motion.div
                  key={post.id}
                  whileHover={{ scale: 1.05 }}
                  className="popular-post-item"
                >
                  <a href={`/blog/${post.id}`} className="text-decoration-none">
                    <div className="popular-post-title">{post.title}</div>
                  </a>
                </motion.div>
              ))}
            </div>

            {showScrollButtons && (
              <button
                className="scroll-button right"
                onClick={() => scroll('right')}
              >
                <FaArrowRight />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="blog-search-section">
        <div className="container">
          <InputGroup className="mb-4">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <FormControl
              placeholder="Search posts by title, content or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </div>
      </section>

      {/* Main Blog Posts */}
      <section className="blog-posts-section">
        <div className="container">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-5">
              <h4>No posts found matching your search</h4>
              <Button
                variant="outline-primary"
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </Button>
            </div>
          ) : (
            <div className="row">
              {filteredPosts.map((post) => (
                <div key={post.id} className="col-md-6 col-lg-4 mb-4">
                  <motion.div whileHover={{ y: -5 }}>
                    <Card className="h-100">
                      <Card.Body>
                        <Card.Title>{post.title}</Card.Title>
                        <Card.Text className="text-muted small">
                          {post.content.substring(0, 150)}...
                        </Card.Text>
                        {post.tags && (
                          <div className="mb-3">
                            {post.tags.map((tag) => (
                              <Badge key={tag} bg="secondary" className="me-1">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Button
                          variant="primary"
                          href={`/blog/${post.id}`}
                          size="sm"
                        >
                          Read More
                        </Button>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Blog;
