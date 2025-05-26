import Head from "next/head";

export default function RevenueModelPage() {
  return (
    <>
      <Head>
        <title>Revenue Model - Papers Platform</title>
        <meta
          name="description"
          content="Learn about the revenue sharing model for contributors on past exam Papers Platform."
        />
      </Head>
      <div className="min-h-screen bg-[#f7f9fb] text-black py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">
            Revenue Model (v1.0)
          </h1>

          <p className="mb-6 leading-relaxed">
            Our platform currently allows users to share{" "}
            <strong>past examination papers</strong> from universities and
            colleges. Contributors are compensated based on the advertisement
            revenue generated through their uploaded content.
          </p>

          <hr className="my-8 border-gray-300" />

          <h2 className="text-2xl font-semibold mb-4">Revenue Distribution</h2>

          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2">
              1. Ad Revenue from Uploaded Papers
            </h3>
            <p className="mb-2 leading-relaxed">
              Contributors earn{" "}
              <strong>55% of the total advertising revenue</strong> generated
              from the papers they upload. This incentivizes quality and
              relevance, rewarding those who contribute the most useful academic
              content.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2">
              2. Ad Revenue from Added Universities
            </h3>
            <p className="mb-2 leading-relaxed">
              If you add a new university or college that was not previously on
              our platform, you earn{" "}
              <strong>1% of the total advertising revenue</strong> generated
              from
              <em>all</em> papers uploaded under that university, for a
              lifetime.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2">3. Payment Process</h3>
            <p className="mb-2 leading-relaxed">
              At the end of each month, you will receive an email detailing your
              total earnings. You can then provide your payment details (e.g.,
              bank account, PayPal) through a secure portal to withdraw your
              earnings. Payments are processed within 5-7 business days.
            </p>
          </div>

          <hr className="my-8 border-gray-300" />

          <h2 className="text-2xl font-semibold mb-4">Transparency</h2>

          <p className="mb-6 leading-relaxed">
            We are committed to transparency. Your dashboard will display
            real-time estimates of your earnings based on ad impressions and
            clicks on your uploaded papers and the papers under universities
            you&apos;ve added. Official earnings reports will be sent monthly
            via email.
          </p>

          <hr className="my-8 border-gray-300" />

          <h2 className="text-2xl font-semibold mb-4">Future Plans</h2>

          <p className="mb-2 leading-relaxed">
            As the platform grows, we plan to introduce additional revenue
            streams and features to further reward contributors, such as:
          </p>
          <ul className="list-disc list-inside mb-6 leading-relaxed">
            <li>Premium content subscriptions with revenue sharing.</li>
            <li>Direct donations from users to contributors.</li>
            <li>Sponsorship opportunities for high-quality papers.</li>
          </ul>

          <p className="leading-relaxed">
            Our goal is to build a sustainable ecosystem where knowledge sharing
            benefits everyone involved.
          </p>

          <hr className="my-8 border-gray-300" />

          <h2 className="text-2xl font-semibold mb-4">
            💳 Monthly Payment Process
          </h2>

          <p className="mb-6 leading-relaxed">
            To ensure trust and simplicity, we follow a{" "}
            <strong>transparent monthly payout system via email</strong>:
          </p>

          <ul className="list-disc list-inside mb-6 leading-relaxed">
            <li>
              At the end of each month, all contributors will receive a{" "}
              <strong>revenue report</strong> detailing:
              <ul className="list-[circle] list-inside ml-4 mt-1 leading-relaxed">
                <li>The number of views on ads</li>
                <li>Estimated ad revenue generated from their uploads</li>
                <li>Their payout amount</li>
              </ul>
            </li>
            <li>
              Payouts are processed manually through{" "}
              <strong>UPI or bank transfer</strong>, based on the details you
              provide in response to the monthly email.
            </li>
            <li>
              Our goal is to build a{" "}
              <strong>trust-based, creator-first community</strong>, where you
              don&apos;t need to worry about complex dashboards or hidden
              deductions.
            </li>
          </ul>

          <blockquote className="text-gray-600 border-l-4 border-gray-300 pl-4 italic mt-2 mb-6">
            We believe in simplicity, clarity, and fair reward.
          </blockquote>

          <hr className="my-8 border-gray-300" />

          <h2 className="text-2xl font-semibold mb-4">Feedback & Support</h2>

          <p className="mb-6 leading-relaxed">
            We&apos;re always listening. For questions, feature suggestions, or
            payout-related queries, reach out at:
          </p>
          <p className="mb-6 text-center font-semibold leading-relaxed">
            {" "}
            <a
              href="mailto:rahulyyadav20@outlook.com"
              className="text-blue-600 hover:underline"
            >
              rahulyyadav20@outlook.com
            </a>
          </p>

          <hr className="my-8 border-gray-300" />

          {/* Added Note */}
          <div className="mt-8 p-6 bg-gray-100 rounded-lg leading-relaxed">
            <p className="font-semibold mb-2">Note:</p>
            <p>
              We are currently in the version 1 phase and are constantly
              improving the platform for your ease. Please keep your patience
              and support up. If you encounter any bugs or difficulties, please
              feel free to provide feedback.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
