// Enhanced Blog.js with futuristic design, mobile-friendly carousel, and hidden tags in main section
import React, { useState, useRef } from 'react';
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
import { Link } from 'react-router-dom';
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

const Blog = ({ isAdmin = false }) => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

  // Add ref for carousel
  const carouselRef = useRef(null);

  // Current date for the blog posts
  const currentDate = '2025-04-13';
  const currentTime = '15:47:58';
  const currentUser = 'Mikutzu55';

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

  // Sample featured/popular posts for the carousel
  const featuredPosts = [
    {
      id: 'featured-1',
      title: 'The Revolutionary Impact of AI on Vehicle Diagnostics',
      excerpt:
        'How artificial intelligence is transforming the way we diagnose and repair vehicles...',
      image:
        'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80',
      category: 'tech',
      date: currentDate,
      time: currentTime,
      author: currentUser,
      tags: ['Technology', 'Repair'],
      featured: true,
    },
    {
      id: 'featured-2',
      title: 'Top 10 Electric Vehicles of 2025: Range and Performance',
      excerpt:
        'The latest electric vehicles pushing the boundaries of range and performance...',
      image:
        'https://images.unsplash.com/photo-1554744512-d6c603f27c54?auto=format&fit=crop&w=1200&q=80',
      category: 'reviews',
      date: '2025-03-28',
      author: 'Sophia Chen',
      tags: ['Electric Vehicles', 'Performance'],
      featured: true,
    },
    {
      id: 'featured-3',
      title: 'Vintage Restoration: Bringing Classic Cars Back to Life',
      excerpt:
        'Inside the meticulous process of restoring classic automobiles to their former glory...',
      image:
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
      category: 'maintenance',
      date: '2025-04-05',
      author: 'Robert Martinez',
      tags: ['Classic Cars', 'Repair'],
      featured: true,
    },
  ];

  // Sample regular blog posts
  const blogPostsData = [
    {
      id: 1,
      title: 'The Future of Electric Vehicles and Autonomous Driving',
      excerpt:
        'Explore how AI and electric powertrains are revolutionizing the automotive industry...',
      image:
        'https://images.unsplash.com/photo-1593941707882-a56bbc451a1d?auto=format&fit=crop&w=800',
      author: 'Alex Johnson',
      date: currentDate,
      time: currentTime,
      category: 'tech',
      tags: ['Electric Vehicles', 'Technology', 'Performance'],
      comments: 24,
      reading_time: '7 min',
    },
    {
      id: 2,
      title: 'Classic Car Restoration: A Complete Guide',
      excerpt:
        'Learn the essential techniques for restoring vintage automobiles to their former glory...',
      image:
        'https://images.unsplash.com/photo-1532581140115-3e355d1ed1de?auto=format&fit=crop&w=800',
      author: 'Maria Garcia',
      date: '2025-04-10',
      category: 'maintenance',
      tags: ['Classic Cars', 'Car Care', 'DIY'],
      comments: 18,
      reading_time: '12 min',
    },
    {
      id: 3,
      title: 'Advanced Driver Assistance Systems: Safety Review',
      excerpt:
        'A comprehensive look at the latest safety technologies in modern vehicles...',
      image:
        'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800',
      author: 'James Wilson',
      date: '2025-03-28',
      category: 'reviews',
      tags: ['Safety', 'Technology', 'Reviews'],
      comments: 32,
      reading_time: '9 min',
    },
    {
      id: 4,
      title: 'The Art of Automotive Design: Form and Function',
      excerpt:
        'Discover how car designers balance aesthetics with aerodynamics and engineering requirements...',
      image:
        'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=800',
      author: 'Sophia Chen',
      date: '2025-03-20',
      category: 'news',
      tags: ['Luxury', 'Performance', 'Technology'],
      comments: 15,
      reading_time: '8 min',
    },
    {
      id: 5,
      title: 'DIY Maintenance Tips to Extend Your Vehicle Lifespan',
      excerpt:
        'Simple maintenance routines that every car owner should know to keep their vehicle running smoothly...',
      image:
        'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=800',
      author: 'David Brown',
      date: '2025-03-15',
      category: 'maintenance',
      tags: ['Car Care', 'DIY', 'Repair'],
      comments: 42,
      reading_time: '10 min',
    },
    {
      id: 6,
      title: 'Hydrogen vs Electric: The Future Fuel Debate',
      excerpt:
        'Analyzing the environmental impact and practicality of hydrogen fuel cells versus battery electric powertrains...',
      image:
        'https://images.unsplash.com/photo-1540465351121-37cad7d61a8f?auto=format&fit=crop&w=800',
      author: currentUser,
      date: '2025-03-05',
      category: 'tech',
      tags: ['Electric Vehicles', 'Technology', 'Performance'],
      comments: 36,
      reading_time: '11 min',
    },
  ];

  const [blogPosts, setBlogPosts] = useState(blogPostsData);

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

  // Filter function for posts
  const filteredPosts = () => {
    return blogPosts.filter((post) => {
      // Filter by search term
      const matchesSearch =
        searchTerm === '' ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by category
      const matchesCategory =
        activeCategory === 'all' || post.category === activeCategory;

      // Filter by tags
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => post.tags.includes(tag));

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
            {featuredPosts.map((post) => (
              <div key={post.id} className="featured-post-card">
                <div className="featured-post-image">
                  <img src={post.image} alt={post.title} />
                  <div className="featured-badge">
                    <span>Featured</span>
                  </div>
                </div>
                <div className="featured-post-content">
                  <Badge className="featured-category">
                    {categories.find((cat) => cat.id === post.category)?.name}
                  </Badge>
                  <h3 className="featured-post-title">{post.title}</h3>
                  <p className="featured-post-excerpt">{post.excerpt}</p>
                  <div className="featured-post-meta">
                    <span className="featured-post-date">
                      <FaRegClock /> {post.date}
                    </span>
                    <span className="featured-post-author">
                      <FaRegUser /> {post.author}
                    </span>
                  </div>
                  <Link to={`/blog/${post.id}`} className="featured-post-link">
                    Read More <FaArrowRight />
                  </Link>
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
              <Button as={Link} to="/blog/new" className="new-post-btn">
                <FaPlus className="me-1" /> New Post
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
        {filteredPosts().length > 0 ? (
          <Row>
            {filteredPosts().map((post) => (
              <Col key={post.id} lg={6} className="mb-4">
                <Card className="blog-card glassmorphism-card hover-zoom">
                  <div className="card-img-container">
                    <Card.Img variant="top" src={post.image} alt={post.title} />
                    <div className="card-category-badge">
                      <Badge>
                        {
                          categories.find((cat) => cat.id === post.category)
                            ?.name
                        }
                      </Badge>
                    </div>
                    <div className="card-bookmark-btn">
                      <Button variant="link">
                        <FaRegBookmark />
                      </Button>
                    </div>
                  </div>
                  <Card.Body>
                    <div className="card-meta">
                      <span className="card-date">
                        <FaRegClock /> {post.date}
                      </span>
                      <span className="card-reading-time">
                        {post.reading_time} read
                      </span>
                    </div>
                    <Card.Title className="blog-card-title">
                      {post.title}
                    </Card.Title>
                    <Card.Text className="blog-card-excerpt">
                      {post.excerpt}
                    </Card.Text>
                    {/* Tags removed from the main view */}
                    <div className="card-footer-meta">
                      <div className="author-info">
                        <div className="author-avatar">
                          <span>{post.author.charAt(0)}</span>
                        </div>
                        <span className="author-name">{post.author}</span>
                      </div>
                      <div className="card-actions">
                        <Button variant="link" className="comment-btn">
                          <FaRegComment /> <span>{post.comments}</span>
                        </Button>
                        <Button variant="link" className="share-btn">
                          <FaShare />
                        </Button>
                        {isAdmin && (
                          <Button
                            as={Link}
                            to={`/blog/edit/${post.id}`}
                            variant="link"
                            className="edit-btn"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                  <Link to={`/blog/${post.id}`} className="card-overlay-link">
                    <span className="visually-hidden">
                      Read more about {post.title}
                    </span>
                  </Link>
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

