import { Logo } from '@/components/site/logo'

const columns = [
  {
    title: 'Platform',
    links: ['How it Works', 'Browse Tasks', 'Post Task', 'Pricing', 'FAQs'],
  },
  {
    title: 'Community',
    links: ['For Clients', 'For Freelancers', 'Blog', 'Contact'],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Automate your work with AI agents and expert freelancers. Choose the right execution method for every task.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-heading text-sm font-semibold text-foreground">
                {col.title}
              </p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} AgentHive. All rights reserved.</p>
          <p>Task automation platform powered by AI and freelancers.</p>
        </div>
      </div>
    </footer>
  )
}
