import webbrowser

def open_websites(urls: list[str]) -> None:
    for url in urls:
        url = "http://192.168.68.112:5173" + url
        # url = "https://c012-91-181-120-70.ngrok-free.app" + url

        webbrowser.open_new_tab(url)


websites = []
for i in range(1, 4):
    websites.append("/scan?station=station%20" + str(i))
websites.append("/ranking")

open_websites(websites)