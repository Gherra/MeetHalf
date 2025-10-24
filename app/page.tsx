export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          MeetHalf 🎯
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Find the perfect meeting spot for your group - fair for everyone!
        </p>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">How it works:</h2>
          <ol className="space-y-3">
            <li className="flex items-start">
              <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                1
              </span>
              <span>Add your friends and their locations</span>
            </li>
            <li className="flex items-start">
              <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                2
              </span>
              <span>Choose how each person is traveling (car, transit, walking)</span>
            </li>
            <li className="flex items-start">
              <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                3
              </span>
              <span>Get smart suggestions for places that work for everyone!</span>
            </li>
          </ol>

          <a
            href="/meeting"
            className="mt-6 inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Start Planning →
          </a>
        </div>
      </div>
    </div>
  );
}