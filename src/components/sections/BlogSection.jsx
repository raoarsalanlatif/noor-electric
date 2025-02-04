import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { colors } from '../../styles/variables';

const BlogContainer = styled.section`
  padding: 80px 6%;
  background: ${colors.light};
`;

const SectionTitle = styled.h2`
  color: ${colors.primaryBlue};
  margin-bottom: 40px;
  font-size: 2.5rem;
  text-align: center;
`;

const BlogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
`;

const BlogCard = styled.article`
  background: ${colors.light};
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: 0.3s;

  &:hover {
    transform: translateY(-10px);
  }

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
`;

const BlogContent = styled.div`
  padding: 20px;

  h3 {
    color: ${colors.dark};
    margin-bottom: 10px;
  }

  .meta {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 15px;
  }

  p {
    color: #444;
    margin-bottom: 20px;
  }
`;

const ReadMore = styled(Link)`
  color: ${colors.primaryOrange};
  text-decoration: none;
  font-weight: bold;
  transition: 0.3s;

  &:hover {
    color: ${colors.primaryBlue};
  }
`;

const blogPosts = [
  {
    id: 1,
    title: "The Future of Solar Energy",
    date: "March 15, 2024",
    excerpt: "Discover how solar technology is evolving and what it means for homeowners...",
    image: "https://via.placeholder.com/400x200",
    slug: "future-of-solar-energy"
  },
  {
    id: 2,
    title: "Solar Myths Debunked",
    date: "March 10, 2024",
    excerpt: "We address common misconceptions about solar energy and installation...",
    image: "https://via.placeholder.com/400x200",
    slug: "solar-myths-debunked"
  },
  {
    id: 3,
    title: "Maximizing Solar Panel Efficiency",
    date: "March 5, 2024",
    excerpt: "Learn the best practices for maintaining and optimizing your solar panels...",
    image: "https://via.placeholder.com/400x200",
    slug: "maximizing-solar-efficiency"
  }
];

function BlogSection() {
  return (
    <BlogContainer id="blog">
      <SectionTitle>Latest News & Insights</SectionTitle>
      <BlogGrid>
        {blogPosts.map(post => (
          <BlogCard key={post.id}>
            <img src={post.image} alt={post.title} />
            <BlogContent>
              <h3>{post.title}</h3>
              <div className="meta">{post.date}</div>
              <p>{post.excerpt}</p>
              <ReadMore to={`/blog/${post.slug}`}>Read More →</ReadMore>
            </BlogContent>
          </BlogCard>
        ))}
      </BlogGrid>
    </BlogContainer>
  );
}

export default BlogSection; 