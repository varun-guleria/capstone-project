import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="font-sans text-gray-900">
      {/* Header */}
      <section className="bg-indigo-600 text-white py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">About PrepMate</h1>
        <p className="text-lg max-w-2xl mx-auto">
          Empowering students to achieve their career goals with AI-powered learning tools.
        </p>
      </section>

      {/* Mission Section */}
      <section className="py-16 max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-6 text-indigo-600">Our Mission</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          At PrepMate, we aim to bridge the gap between ambition and achievement.
          Our AI-powered platform provides personalized roadmaps, adaptive quizzes, curated content,
          and progress analytics to help students prepare effectively for placements and career opportunities.
        </p>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-indigo-600 mb-10">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg shadow hover:shadow-lg bg-white">
              <h3 className="font-semibold text-xl mb-3">Innovation</h3>
              <p className="text-gray-600">
                Leveraging AI and modern technologies to create smarter learning solutions.
              </p>
            </div>
            <div className="p-6 border rounded-lg shadow hover:shadow-lg bg-white">
              <h3 className="font-semibold text-xl mb-3">Student Success</h3>
              <p className="text-gray-600">
                Everything we build is focused on helping students achieve their dreams.
              </p>
            </div>
            <div className="p-6 border rounded-lg shadow hover:shadow-lg bg-white">
              <h3 className="font-semibold text-xl mb-3">Accessibility</h3>
              <p className="text-gray-600">
                Making quality placement preparation accessible to everyone, everywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Join PrepMate Today</h2>
        <p className="text-gray-600 mb-6">
          Start your journey to placement success with our AI-powered tools.
        </p>
        <Link
          to="/"
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
        >
          Back to Home
        </Link>
      </section>
    </div>
  );
}