export function Footer() {
  return (
    <footer className="bg-purple-300 text-purple-800 px-4 py-4 mt-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <div>
          ©2025 Rio S., licensed under{" "}
          <a href="#" className="underline hover:no-underline">
            AGPL-3.0
          </a>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:underline">
            Terms of Service
          </a>
          <span>|</span>
          <a href="#" className="hover:underline">
            Privacy Policy
          </a>
          <span>|</span>
          <a href="#" className="hover:underline">
            Github
          </a>
          <span>|</span>
          <a href="#" className="hover:underline">
            Buy Me a Coffee
          </a>
        </div>
      </div>
    </footer>
  )
}
