import React, { FC, useState } from "react";

const GV_Footer: FC = () => {
  // Footer links state variable based on provided default data map
  const [footer_links] = useState([
    { title: "Help", url: "https://picsum.photos/200/300?help" },
    { title: "Terms & Conditions", url: "https://picsum.photos/200/300?terms" },
    { title: "Privacy Policy", url: "https://picsum.photos/200/300?privacy" }
  ]);

  return (
    <>
      <footer className="bg-gray-100 text-gray-600 text-sm py-4 px-6 fixed bottom-0 left-0 right-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span>© {new Date().getFullYear()} ProjectPlanner</span>
          <div>
            {footer_links.map((link, index) => (
              <React.Fragment key={index}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {link.title}
                </a>
                {index < footer_links.length - 1 && (
                  <span className="mx-2">|</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;