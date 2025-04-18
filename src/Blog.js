// Enhanced Blog.js with futuristic design, mobile-friendly carousel, and hidden tags in main section
import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  InputGroup,
  Badge,
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaPlus,
  FaTimes,
  FaArrowRight,
  FaRegClock,
  FaRegUser,
  FaRegComment,
  FaRegBookmark,
  FaShare,
  FaFilter,
  FaEllipsisV,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import { auth, db } from './firebase';
import {
  getDoc,
  doc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const Blog = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add ref for carousel
  const carouselRef = useRef(null);
  const navigate = useNavigate();

  // Current date and time
  const currentDate = '2025-04-18';
  const currentTime = '10:54:01';
  const currentUser = 'Mikutzu55';

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Check if user has admin role
            if (userData.role === 'admin') {
              setIsAdmin(true);
            }
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }
    };

    checkAdminStatus();
  }, []);

  // Sample categories
  const categories = [
    { id: 'all', name: 'All Posts' },
    { id: 'tech', name: 'Technology' },
    { id: 'cars', name: 'Automotive' },
    { id: 'reviews', name: 'Reviews' },
    { id: 'news', name: 'Industry News' },
    { id: 'maintenance', name: 'Maintenance Tips' },
  ];

  // Sample tags
  const availableTags = [
    'Electric Vehicles',
    'Classic Cars',
    'Car Care',
    'Technology',
    'Safety',
    'Performance',
    'Reviews',
    'Repair',
    'DIY',
    'Luxury',
  ];

  // Sample blog posts for fallback
  const blogPostsData = [
    {
      id: '1',
      title: 'The Future of Electric Vehicles and Autonomous Driving',
      excerpt:
        'Explore how AI and electric powertrains are revolutionizing the automotive industry...',
      image:
        'https://images.unsplash.com/photo-1593941707882-a56bbc451a1d?auto=format&fit=crop&w=800',
      author: 'Alex Johnson',
      date: currentDate,
      createdAt: new Date(),
      time: currentTime,
      category: 'tech',
      tags: ['Electric Vehicles', 'Technology', 'Performance'],
      comments: 24,
      reading_time: '7 min',
    },
    // ... other sample blog posts
  ];

  // Sample featured posts for fallback
  const featuredPostsData = [
    {
      id: 'featured-1',
      title: 'The Revolutionary Impact of AI on Vehicle Diagnostics',
      excerpt:
        'How artificial intelligence is transforming the way we diagnose and repair vehicles...',
      image:
        'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80',
      category: 'tech',
      date: currentDate,
      createdAt: new Date(),
      time: currentTime,
      author: currentUser,
      tags: ['Technology', 'Repair'],
      featured: true,
    },
    // ... other sample featured posts
  ];

  // Fetch blog posts from Firestore
  useEffect(() => {
    const fetchBlogPosts = async () => {
      setLoading(true);
      try {
        // Fetch regular posts
        const postsQuery = query(
          collection(db, 'blogPosts'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        const postsSnapshot = await getDocs(postsQuery);

        if (!postsSnapshot.empty) {
          const fetchedPosts = postsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setBlogPosts(fetchedPosts);

          // Filter featured posts
          const fetchedFeatured = fetchedPosts.filter(
            (post) => post.featured === true
          );

          // Use fetched featured posts if available, otherwise use sample data
          if (fetchedFeatured.length > 0) {
            setFeaturedPosts(fetchedFeatured);
          } else {
            // Use top 3 most recent posts as featured if none marked as featured
            setFeaturedPosts(fetchedPosts.slice(0, 3));
          }
        } else {
          // If no posts in Firestore, use sample data
          setBlogPosts(blogPostsData);
          setFeaturedPosts(featuredPostsData);
        }
      } catch (error) {
        console.error('Error fetching blog posts:', error);
        // Fallback to sample data if fetch fails
        setBlogPosts(blogPostsData);
        setFeaturedPosts(featuredPostsData);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  // Handle carousel scrolling
  const handleCarouselScroll = (direction) => {
    const carousel = carouselRef.current;
    if (carousel) {
      // Smaller card width for better mobile experience
      const cardWidth = 300 + 16; // Smaller card width + smaller gap
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Navigate to blog post page
  const navigateToPost = (postId) => {
    navigate(`/blog/${postId}`);
  };

  // Create new post
  const handleCreatePost = () => {
    navigate('/blog/new');
  };

  // Filter function for posts
  const filteredPosts = () => {
    return blogPosts.filter((post) => {
      // Filter by search terma
      const matchesSearch =
        searchTerm === '' ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.excerpt &&
          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filter by category
      const matchesCategory =
        activeCategory === 'all' || post.category === activeCategory;

      // Filter by tags
      const matchesTags =
        selectedTags.length === 0 ||
        (post.tags && selectedTags.every((tag) => post.tags.includes(tag)));

      return matchesSearch && matchesCategory && matchesTags;
    });
  };

  // Handle tag selection
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setActiveCategory('all');
  };

  return (
    <div className="futuristic-blog">
      {/* Hero Section with Parallax Effect */}
      <div className="blog-hero">
        <div className="hero-overlay"></div>
        <Container className="hero-content">
          <h1 className="hero-title">
            Automotive <span className="text-gradient">Insights</span>
          </h1>
          <p className="hero-subtitle">
            Explore the latest trends, technologies, and tips in the automotive
            world
          </p>
        </Container>
      </div>

      {/* Popular Posts Horizontal Scroll Section - Made smaller for mobile */}
      <Container className="mb-5">
        <div className="section-header d-flex justify-content-between align-items-center mb-4">
          <h2 className="section-title">
            Featured <span className="text-gradient">Articles</span>
          </h2>
          <div className="carousel-controls">
            <Button
              variant="outline-primary"
              className="carousel-control"
              onClick={() => handleCarouselScroll('left')}
            >
              <FaChevronLeft />
            </Button>
            <Button
              variant="outline-primary"
              className="carousel-control"
              onClick={() => handleCarouselScroll('right')}
            >
              <FaChevronRight />
            </Button>
          </div>
        </div>

        <div className="popular-posts-carousel-container">
          <div className="popular-posts-carousel" ref={carouselRef}>
            {loading
              ? // Loading skeletons for carousel
                Array(3)
                  .fill()
                  .map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="featured-post-card"
                    >
                      <div className="featured-post-image">
                        <Skeleton height={200} />
                      </div>
                      <div className="featured-post-content">
                        <Skeleton width={80} height={24} />
                        <Skeleton height={30} className="mt-2" />
                        <Skeleton count={2} className="mt-2" />
                        <Skeleton width={150} height={20} className="mt-3" />
                      </div>
                    </div>
                  ))
              : featuredPosts.map((post) => (
                  <div
                    key={post.id}
                    className="featured-post-card"
                    onClick={() => navigateToPost(post.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="featured-post-image">
                      <img src={post.image} alt={post.title} />
                      <div className="featured-badge">
                        <span>Featured</span>
                      </div>
                    </div>
                    <div className="featured-post-content">
                      <Badge className="featured-category">
                        {categories.find((cat) => cat.id === post.category)
                          ?.name || post.category}
                      </Badge>
                      <h3 className="featured-post-title">{post.title}</h3>
                      <p className="featured-post-excerpt">{post.excerpt}</p>
                      <div className="featured-post-meta">
                        <span className="featured-post-date">
                          <FaRegClock />{' '}
                          {post.date ||
                            (post.createdAt &&
                              new Date(
                                post.createdAt.seconds * 1000
                              ).toLocaleDateString())}
                        </span>
                        <span className="featured-post-author">
                          <FaRegUser /> {post.author}
                        </span>
                      </div>
                      <div className="featured-post-link">
                        Read More <FaArrowRight />
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </Container>

      {/* Search and Filter Section */}
      <Container className="search-filter-section">
        <Row className="search-bar-wrapper">
          <Col md={9}>
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <Form.Control
                className="search-input"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="link"
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  <FaTimes />
                </Button>
              )}
            </div>
          </Col>

          <Col md={3} className="d-flex justify-content-end gap-2">
            {isAdmin && (
              <Button
                onClick={handleCreatePost}
                className="new-post-btn"
                variant="primary"
              >
                <FaPlus className="me-1" /> Create Post
              </Button>
            )}
          </Col>
        </Row>

        {/* Category Tabs */}
        <div className="category-tabs mb-4">
          <div className="category-scrollbar">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  activeCategory === category.id ? 'primary' : 'outline-primary'
                }
                onClick={() => setActiveCategory(category.id)}
                className="category-tab-btn"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Tag Filter Pills */}
        <div className="tag-filters">
          <Button variant="outline-secondary" className="filter-btn me-2">
            <FaFilter /> <span className="ms-1">Filter by Tags</span>
          </Button>
          <div className="tag-pills-container">
            {availableTags.map((tag) => (
              <Button
                key={tag}
                variant="outline-primary"
                className={`tag-pill ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm ||
          selectedTags.length > 0 ||
          activeCategory !== 'all') && (
          <div className="selected-tags mt-3">
            <span className="filter-label">Active filters:</span>

            {activeCategory !== 'all' && (
              <Badge className="selected-tag">
                Category:{' '}
                {categories.find((cat) => cat.id === activeCategory).name}
                <FaTimes
                  className="ms-2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveCategory('all')}
                />
              </Badge>
            )}

            {searchTerm && (
              <Badge className="selected-tag">
                Search: {searchTerm}
                <FaTimes
                  className="ms-2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSearchTerm('')}
                />
              </Badge>
            )}

            {selectedTags.map((tag) => (
              <Badge key={tag} className="selected-tag">
                {tag}
                <FaTimes
                  className="ms-2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleTag(tag)}
                />
              </Badge>
            ))}

            <Button
              variant="link"
              className="clear-filters ms-2"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          </div>
        )}
      </Container>

      {/* Blog Posts Grid - Tags removed from main view */}
      <Container className="blog-posts-section">
        {loading ? (
          // Loading skeletons for blog posts
          <Row>
            {Array(6)
              .fill()
              .map((_, index) => (
                <Col key={`skeleton-post-${index}`} lg={6} className="mb-4">
                  <Card className="blog-card glassmorphism-card">
                    <div className="card-img-container">
                      <Skeleton height={200} />
                    </div>
                    <Card.Body>
                      <div className="card-meta">
                        <Skeleton width={120} />
                      </div>
                      <Skeleton height={28} className="mt-2" />
                      <Skeleton count={2} className="mt-2" />
                      <div className="d-flex justify-content-between mt-3">
                        <Skeleton width={100} />
                        <Skeleton width={80} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
          </Row>
        ) : filteredPosts().length > 0 ? (
          <Row>
            {filteredPosts().map((post) => (
              <Col key={post.id} lg={6} className="mb-4">
                <Card
                  className="blog-card glassmorphism-card hover-zoom"
                  onClick={() => navigateToPost(post.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-img-container">
                    <Card.Img variant="top" src={post.image} alt={post.title} />
                    <div className="card-category-badge">
                      <Badge>
                        {categories.find((cat) => cat.id === post.category)
                          ?.name || post.category}
                      </Badge>
                    </div>
                    <div className="card-bookmark-btn">
                      <Button
                        variant="link"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click event
                          // Add bookmark functionality here
                        }}
                      >
                        <FaRegBookmark />
                      </Button>
                    </div>
                  </div>
                  <Card.Body>
                    <div className="card-meta">
                      <span className="card-date">
                        <FaRegClock />{' '}
                        {post.date ||
                          (post.createdAt &&
                            new Date(
                              post.createdAt.seconds * 1000
                            ).toLocaleDateString())}
                      </span>
                      <span className="card-reading-time">
                        {post.reading_time || '5 min read'}
                      </span>
                    </div>
                    <Card.Title className="blog-card-title">
                      {post.title}
                    </Card.Title>
                    <Card.Text className="blog-card-excerpt">
                      {post.excerpt}
                    </Card.Text>
                    <div className="card-footer-meta">
                      <div className="author-info">
                        <div className="author-avatar">
                          <span>
                            {post.author ? post.author.charAt(0) : 'A'}
                          </span>
                        </div>
                        <span className="author-name">{post.author}</span>
                      </div>
                      <div className="card-actions">
                        <Button
                          variant="link"
                          className="comment-btn"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click event
                            // Comments functionality here
                          }}
                        >
                          <FaRegComment /> <span>{post.comments || 0}</span>
                        </Button>
                        <Button
                          variant="link"
                          className="share-btn"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click event
                            // Share functionality here
                          }}
                        >
                          <FaShare />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="link"
                            className="edit-btn"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click event
                              navigate(`/blog/edit/${post.id}`);
                            }}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="no-results">
            <h3>No posts found</h3>
            <p>Try adjusting your search or filter criteria</p>
            <Button variant="primary" onClick={clearFilters}>
              Clear all filters
            </Button>
          </div>
        )}

        {/* Load More Button */}
        {filteredPosts().length > 6 && (
          <div className="text-center mt-4 mb-5">
            <Button variant="outline-primary" className="load-more-btn">
              Load More <FaArrowRight className="ms-2" />
            </Button>
          </div>
        )}
      </Container>

      {/* Newsletter Section */}
      <div className="newsletter-section">
        <Container>
          <div className="newsletter-content glassmorphism-card">
            <Row className="align-items-center">
              <Col md={6}>
                <h2>
                  Stay <span className="text-gradient">Updated</span>
                </h2>
                <p>
                  Subscribe to our newsletter for the latest automotive
                  insights, trends, and exclusive content.
                </p>
              </Col>
              <Col md={6}>
                <Form>
                  <InputGroup className="mb-3">
                    <Form.Control
                      placeholder="Your email address"
                      aria-label="Email address"
                    />
                    <Button variant="primary">Subscribe</Button>
                  </InputGroup>
                  <Form.Check
                    type="checkbox"
                    id="privacy-check"
                    label="I agree to the privacy policy"
                    className="text-small"
                  />
                </Form>
              </Col>
            </Row>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default Blog;


