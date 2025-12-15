import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies }) => {
	return {
		sidebarOpen: cookies.get('sidebar-open') === 'true'
	};
};
